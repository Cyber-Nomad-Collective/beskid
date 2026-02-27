use crate::model::{InteropDecl, InteropParam, ReturnGroup};
use anyhow::{Context, Result};
use std::fs;
use std::path::{Path, PathBuf};
use syn::{FnArg, Item, Pat, ReturnType, Type};

pub fn collect_spec_files(root: &Path) -> Result<Vec<PathBuf>> {
    if !root.exists() {
        anyhow::bail!("interop spec root does not exist: `{}`", root.display());
    }
    let mut files = Vec::new();
    collect_spec_files_recursive(root, &mut files)?;
    files.sort();
    Ok(files)
}

fn collect_spec_files_recursive(root: &Path, files: &mut Vec<PathBuf>) -> Result<()> {
    for entry in fs::read_dir(root).with_context(|| format!("read directory `{}`", root.display()))? {
        let entry = entry.with_context(|| format!("read entry under `{}`", root.display()))?;
        let path = entry.path();
        if path.is_dir() {
            collect_spec_files_recursive(&path, files)?;
            continue;
        }
        if path.extension().and_then(|ext| ext.to_str()) == Some("rs") {
            files.push(path);
        }
    }
    Ok(())
}

pub fn parse_spec_file(path: &Path) -> Result<Vec<InteropDecl>> {
    let source = fs::read_to_string(path)
        .with_context(|| format!("read interop spec file `{}`", path.display()))?;
    let file = syn::parse_file(&source)
        .with_context(|| format!("parse interop spec file `{}`", path.display()))?;

    let mut decls = Vec::new();
    for item in file.items {
        let Item::Fn(function) = item else {
            continue;
        };

        let Some((module_path, explicit_name)) = parse_interop_attr(&function.attrs)
            .with_context(|| format!("{}:1", path.display()))?
        else {
            continue;
        };

        let runtime_symbol = function.sig.ident.to_string();
        let function_name = explicit_name.unwrap_or_else(|| runtime_symbol.clone());
        let variant_name = make_variant_name(&module_path, &function_name);
        let params = map_params(&function.sig.inputs)?;
        let return_group = map_return(&function.sig.output)?;

        decls.push(InteropDecl {
            module_path,
            function_name,
            runtime_symbol,
            variant_name,
            params,
            return_group,
            source: path.to_path_buf(),
            line: 1,
        });
    }

    Ok(decls)
}

fn parse_interop_attr(attrs: &[syn::Attribute]) -> Result<Option<(String, Option<String>)>> {
    let Some(attr) = attrs.iter().find(|attr| attr.path().is_ident("InteropCall")) else {
        return Ok(None);
    };

    let mut module_path: Option<String> = None;
    let mut explicit_name: Option<String> = None;

    attr.parse_nested_meta(|meta| {
        if module_path.is_none() && !meta.path.is_ident("name") {
            module_path = Some(path_to_module(&meta.path));
            return Ok(());
        }

        if meta.path.is_ident("name") {
            let value = meta.value()?;
            let lit: syn::LitStr = value.parse()?;
            explicit_name = Some(lit.value());
            return Ok(());
        }

        Err(meta.error("unsupported InteropCall argument"))
    })?;

    let Some(module_path) = module_path else {
        anyhow::bail!("InteropCall requires module path, e.g. #[InteropCall(std::io)]");
    };

    Ok(Some((module_path, explicit_name)))
}

fn path_to_module(path: &syn::Path) -> String {
    path.segments
        .iter()
        .map(|segment| segment.ident.to_string())
        .collect::<Vec<_>>()
        .join(".")
}

fn map_params(inputs: &syn::punctuated::Punctuated<FnArg, syn::token::Comma>) -> Result<Vec<InteropParam>> {
    let mut params = Vec::new();
    for arg in inputs {
        let FnArg::Typed(pat_type) = arg else {
            anyhow::bail!("unsupported receiver in interop declaration");
        };
        let Pat::Ident(pat_ident) = pat_type.pat.as_ref() else {
            anyhow::bail!("expected identifier parameter pattern");
        };
        let name = pat_ident.ident.to_string();
        let beskid_type = map_rust_param_type(&pat_type.ty)?;
        params.push(InteropParam { name, beskid_type });
    }
    Ok(params)
}

fn map_rust_param_type(ty: &Type) -> Result<String> {
    match ty {
        Type::Reference(reference) => {
            if let Type::Path(type_path) = reference.elem.as_ref()
                && let Some(seg) = type_path.path.segments.last()
            {
                let ident = seg.ident.to_string();
                if ident == "str" || ident == "String" {
                    return Ok("string".to_string());
                }
            }
            anyhow::bail!("unsupported interop parameter reference type")
        }
        Type::Path(type_path) => {
            if let Some(seg) = type_path.path.segments.last() {
                let ident = seg.ident.to_string();
                if ident == "String" {
                    return Ok("string".to_string());
                }
            }
            anyhow::bail!("unsupported interop parameter path type")
        }
        Type::Ptr(ptr) => {
            if ptr.const_token.is_some()
                && let Type::Path(type_path) = ptr.elem.as_ref()
                && let Some(seg) = type_path.path.segments.last()
                && seg.ident == "BeskidStr"
            {
                return Ok("string".to_string());
            }
            anyhow::bail!("unsupported interop pointer parameter type")
        }
        _ => anyhow::bail!("unsupported interop parameter type"),
    }
}

fn map_return(output: &ReturnType) -> Result<ReturnGroup> {
    match output {
        ReturnType::Default => Ok(ReturnGroup::Unit),
        ReturnType::Type(_, ty) => match ty.as_ref() {
            Type::Path(type_path) => {
                let ident = type_path
                    .path
                    .segments
                    .last()
                    .map(|segment| segment.ident.to_string())
                    .unwrap_or_default();
                match ident.as_str() {
                    "usize" => Ok(ReturnGroup::Usize),
                    _ => anyhow::bail!("unsupported interop return type `{ident}`"),
                }
            }
            Type::Ptr(ptr) if ptr.mutability.is_some() => Ok(ReturnGroup::Ptr),
            _ => anyhow::bail!("unsupported interop return type"),
        },
    }
}

fn make_variant_name(module_path: &str, function_name: &str) -> String {
    let mut parts = module_path
        .split('.')
        .skip(1)
        .map(pascal_case)
        .collect::<Vec<_>>();
    parts.push(pascal_case(function_name));
    parts.join("")
}

fn pascal_case(input: &str) -> String {
    input
        .split('_')
        .filter(|part| !part.is_empty())
        .map(|part| {
            let mut chars = part.chars();
            match chars.next() {
                Some(first) => {
                    let mut out = String::new();
                    out.extend(first.to_uppercase());
                    out.push_str(chars.as_str());
                    out
                }
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join("")
}
