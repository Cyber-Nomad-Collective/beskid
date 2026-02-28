use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{
    Attribute, Data, DeriveInput, Fields, GenericArgument, LitStr, PathArguments, Type,
    parse_macro_input,
};

#[proc_macro_derive(AstNode, attributes(ast))]
pub fn derive_ast_node(input: TokenStream) -> TokenStream {
    derive_node_impl(
        input,
        quote! { crate::query::AstNode },
        quote! { crate::query::DynNodeRef },
        quote! { crate::query::NodeKind },
    )
}

#[proc_macro_derive(HirNode, attributes(ast))]
pub fn derive_hir_node(input: TokenStream) -> TokenStream {
    derive_node_impl(
        input,
        quote! { crate::query::HirNode },
        quote! { crate::query::HirNodeRef },
        quote! { crate::query::HirNodeKind },
    )
}

fn derive_node_impl(
    input: TokenStream,
    node_trait: proc_macro2::TokenStream,
    node_ref: proc_macro2::TokenStream,
    node_kind: proc_macro2::TokenStream,
) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;
    let generics = input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();
    let kind_ident = parse_kind_attr(&input.attrs).unwrap_or_else(|| name.clone());

    let children_body = match &input.data {
        Data::Struct(ds) => gen_struct_children(
            ds.fields.iter().collect::<Vec<_>>(),
            &node_trait,
            &node_ref,
        ),
        Data::Enum(en) => {
            gen_enum_children(en.variants.iter().collect::<Vec<_>>(), &node_trait, &node_ref)
        }
        Data::Union(_) => quote! {},
    };

    let expanded = quote! {
        #[allow(unused_variables)]
        impl #impl_generics #node_trait for #name #ty_generics #where_clause {
            fn as_any(&self) -> &dyn ::core::any::Any { self }
            fn children<'a>(&'a self, push: &mut dyn FnMut(#node_ref<'a>)) {
                #children_body
            }
            fn node_kind(&self) -> #node_kind {
                #node_kind::#kind_ident
            }
        }
    };

    TokenStream::from(expanded)
}

#[proc_macro_derive(PhaseFromAst, attributes(phase))]
pub fn derive_phase_from_ast(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;
    let phase_attr = match parse_phase_attr(&input.attrs) {
        Ok(Some(value)) => value,
        Ok(None) => {
            return syn::Error::new_spanned(
                name,
                "PhaseFromAst requires #[phase(source = \"...\", phase = \"...\")]",
            )
            .to_compile_error()
            .into();
        }
        Err(err) => return err.to_compile_error().into(),
    };

    let target_type = match input.generics.params.len() {
        0 => quote! { #name },
        1 => {
            let phase = &phase_attr.phase;
            quote! { #name < #phase > }
        }
        _ => {
            return syn::Error::new_spanned(
                name,
                "PhaseFromAst supports enums with at most one type parameter",
            )
            .to_compile_error()
            .into();
        }
    };

    let source_path = &phase_attr.source;
    let expanded = match &input.data {
        Data::Enum(enum_data) => {
            let mut arms = Vec::new();
            for variant in &enum_data.variants {
                let target_ident = &variant.ident;
                let source_ident =
                    parse_variant_from_attr(&variant.attrs).unwrap_or_else(|| target_ident.clone());
                let arm = match &variant.fields {
                    Fields::Unnamed(fields) if fields.unnamed.len() == 1 => quote! {
                        #source_path::#source_ident(value) => #name::#target_ident(value),
                    },
                    Fields::Unit => quote! {
                        #source_path::#source_ident => #name::#target_ident,
                    },
                    _ => {
                        return syn::Error::new_spanned(
                            &variant.fields,
                            "PhaseFromAst only supports unit or single-field tuple variants",
                        )
                        .to_compile_error()
                        .into();
                    }
                };
                arms.push(arm);
            }

            quote! {
                impl ::core::convert::From<crate::syntax::Spanned<#source_path>>
                    for crate::syntax::Spanned<#target_type>
                {
                    fn from(value: crate::syntax::Spanned<#source_path>) -> Self {
                        let span = value.span;
                        let node = match value.node {
                            #( #arms )*
                        };
                        crate::syntax::Spanned::new(node, span)
                    }
                }
            }
        }
        Data::Struct(struct_data) => {
            let fields = match &struct_data.fields {
                Fields::Named(fields) => fields.named.iter().collect::<Vec<_>>(),
                Fields::Unnamed(fields) if fields.unnamed.len() == 1 => {
                    fields.unnamed.iter().collect()
                }
                _ => {
                    return syn::Error::new_spanned(
                        &struct_data.fields,
                        "PhaseFromAst only supports named structs or single-field tuple structs",
                    )
                    .to_compile_error()
                    .into();
                }
            };

            let field_builds = fields.iter().enumerate().map(|(idx, field)| {
                let access = if let Some(ident) = &field.ident {
                    quote! { value.node.#ident }
                } else {
                    let index = syn::Index::from(idx);
                    quote! { value.node.#index }
                };
                let conversion = gen_phase_field_conversion(&field.ty, access);
                if let Some(ident) = &field.ident {
                    quote! { #ident: #conversion }
                } else {
                    quote! { #conversion }
                }
            });

            let construct = match &struct_data.fields {
                Fields::Named(_) => quote! { #name { #( #field_builds ),* } },
                Fields::Unnamed(_) => quote! { #name ( #( #field_builds ),* ) },
                Fields::Unit => quote! { #name },
            };

            quote! {
                impl ::core::convert::From<crate::syntax::Spanned<#source_path>>
                    for crate::syntax::Spanned<#target_type>
                {
                    fn from(value: crate::syntax::Spanned<#source_path>) -> Self {
                        let span = value.span;
                        let node = #construct;
                        crate::syntax::Spanned::new(node, span)
                    }
                }
            }
        }
        _ => {
            return syn::Error::new_spanned(
                name,
                "PhaseFromAst can only be derived for enums or structs",
            )
            .to_compile_error()
            .into();
        }
    };

    TokenStream::from(expanded)
}

fn parse_kind_attr(attrs: &[Attribute]) -> Option<syn::Ident> {
    for attr in attrs {
        if !attr.path().is_ident("ast") {
            continue;
        }
        let mut found = None;
        let _ = attr.parse_nested_meta(|meta| {
            if meta.path.is_ident("kind") {
                let lit: LitStr = meta.value()?.parse()?;
                found = Some(format_ident!("{}", lit.value()));
            }
            Ok(())
        });
        if found.is_some() {
            return found;
        }
    }
    None
}

struct PhaseAttr {
    source: syn::Path,
    phase: syn::Path,
}

fn parse_phase_attr(attrs: &[Attribute]) -> Result<Option<PhaseAttr>, syn::Error> {
    for attr in attrs {
        if !attr.path().is_ident("phase") {
            continue;
        }
        let mut source = None;
        let mut phase = None;
        attr.parse_nested_meta(|meta| {
            if meta.path.is_ident("source") {
                let lit: LitStr = meta.value()?.parse()?;
                source = Some(lit.parse()?);
            } else if meta.path.is_ident("phase") {
                let lit: LitStr = meta.value()?.parse()?;
                phase = Some(lit.parse()?);
            }
            Ok(())
        })?;
        if let (Some(source), Some(phase)) = (source, phase) {
            return Ok(Some(PhaseAttr { source, phase }));
        }
        return Err(syn::Error::new_spanned(
            attr,
            "phase attribute requires source and phase",
        ));
    }
    Ok(None)
}

fn parse_variant_from_attr(attrs: &[Attribute]) -> Option<syn::Ident> {
    for attr in attrs {
        if !attr.path().is_ident("phase") {
            continue;
        }
        let mut found = None;
        let _ = attr.parse_nested_meta(|meta| {
            if meta.path.is_ident("from") {
                let lit: LitStr = meta.value()?.parse()?;
                found = Some(format_ident!("{}", lit.value()));
            }
            Ok(())
        });
        if found.is_some() {
            return found;
        }
    }
    None
}

fn parse_field_attr(attrs: &[Attribute]) -> FieldAttr {
    for attr in attrs {
        if !attr.path().is_ident("ast") {
            continue;
        }
        let mut found = None;
        let _ = attr.parse_nested_meta(|meta| {
            if meta.path.is_ident("child") {
                found = Some(FieldAttr::Child);
            } else if meta.path.is_ident("children") {
                found = Some(FieldAttr::Children);
            } else if meta.path.is_ident("skip") {
                found = Some(FieldAttr::Skip);
            }
            Ok(())
        });
        if let Some(attr) = found {
            return attr;
        }
    }
    FieldAttr::Skip
}

enum FieldAttr {
    Child,
    Children,
    Skip,
}

fn gen_struct_children(
    fields: Vec<&syn::Field>,
    node_trait: &proc_macro2::TokenStream,
    node_ref: &proc_macro2::TokenStream,
) -> proc_macro2::TokenStream {
    let mut stmts = Vec::new();
    for (idx, field) in fields.iter().enumerate() {
        let attr = parse_field_attr(&field.attrs);
        if matches!(attr, FieldAttr::Skip) {
            continue;
        }
        let access = if let Some(ident) = &field.ident {
            quote! { &self.#ident }
        } else {
            let index = syn::Index::from(idx);
            quote! { &self.#index }
        };
        stmts.push(gen_push_for_type(&field.ty, access, node_trait, node_ref));
    }
    quote! { #(#stmts)* }
}

fn gen_enum_children(
    variants: Vec<&syn::Variant>,
    node_trait: &proc_macro2::TokenStream,
    node_ref: &proc_macro2::TokenStream,
) -> proc_macro2::TokenStream {
    let mut arms = Vec::new();
    for variant in variants {
        let vident = &variant.ident;
        let vattr = parse_field_attr(&variant.attrs);
        match &variant.fields {
            Fields::Unit => arms.push(quote! { Self::#vident => {} }),
            Fields::Unnamed(unnamed) => {
                let mut binds = Vec::new();
                let mut stmts = Vec::new();
                for (i, field) in unnamed.unnamed.iter().enumerate() {
                    let fattr = parse_field_attr(&field.attrs);
                    let attr = if matches!(fattr, FieldAttr::Skip) && i == 0 {
                        &vattr
                    } else {
                        &fattr
                    };

                    if matches!(attr, FieldAttr::Skip) {
                        binds.push(quote! { _ });
                        continue;
                    }
                    let binding = format_ident!("f{}", i);
                    binds.push(quote! { #binding });
                    stmts.push(gen_push_for_type(
                        &field.ty,
                        quote! { #binding },
                        node_trait,
                        node_ref,
                    ));
                }
                arms.push(quote! { Self::#vident( #(#binds),* ) => { #(#stmts)* } });
            }
            Fields::Named(named) => {
                let mut binds = Vec::new();
                let mut stmts = Vec::new();
                for field in &named.named {
                    let fname = field.ident.as_ref().unwrap();
                    let fattr = parse_field_attr(&field.attrs);
                    let attr = if matches!(fattr, FieldAttr::Skip) {
                        &vattr
                    } else {
                        &fattr
                    };

                    if matches!(attr, FieldAttr::Skip) {
                        binds.push(quote! { #fname: _ });
                        continue;
                    }
                    binds.push(quote! { #fname });
                    stmts.push(gen_push_for_type(
                        &field.ty,
                        quote! { #fname },
                        node_trait,
                        node_ref,
                    ));
                }
                arms.push(quote! { Self::#vident { #(#binds),* } => { #(#stmts)* } });
            }
        }
    }
    quote! { match self { #( #arms ),* } }
}

fn gen_push_for_type(
    ty: &Type,
    access: proc_macro2::TokenStream,
    node_trait: &proc_macro2::TokenStream,
    node_ref: &proc_macro2::TokenStream,
) -> proc_macro2::TokenStream {
    match ty {
        Type::Path(tp) => {
            if let Some(seg) = tp.path.segments.last() {
                let ident = &seg.ident;
                let args = &seg.arguments;
                let ident_str = ident.to_string();
                match (ident_str.as_str(), args) {
                    ("Option", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let v = format_ident!("__v");
                            let inner =
                                gen_push_for_type(inner_ty, quote! { #v }, node_trait, node_ref);
                            return quote! {
                                if let ::core::option::Option::Some(#v) = (#access).as_ref() {
                                    #inner
                                }
                            };
                        }
                    }
                    ("Vec", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let v = format_ident!("__it");
                            let inner =
                                gen_push_for_type(inner_ty, quote! { #v }, node_trait, node_ref);
                            return quote! {
                                for #v in (#access).iter() {
                                    #inner
                                }
                            };
                        }
                    }
                    ("Box", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner = gen_push_for_type(
                                inner_ty,
                                quote! { (#access).as_ref() },
                                node_trait,
                                node_ref,
                            );
                            return quote! { #inner };
                        }
                    }
                    ("Spanned", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner_access = quote! { &((#access).node) };
                            return gen_push_for_type(inner_ty, inner_access, node_trait, node_ref);
                        }
                    }
                    _ => {}
                }
                if is_primitive_like(ident) {
                    return quote! {};
                }
            }
            quote! {
                let __n: &'a dyn #node_trait = #access;
                push(#node_ref(__n));
            }
        }
        _ => quote! {},
    }
}

fn gen_phase_field_conversion(
    ty: &Type,
    access: proc_macro2::TokenStream,
) -> proc_macro2::TokenStream {
    match ty {
        Type::Path(tp) => {
            if let Some(seg) = tp.path.segments.last() {
                let ident = &seg.ident;
                let args = &seg.arguments;
                let ident_str = ident.to_string();
                match (ident_str.as_str(), args) {
                    ("Option", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner = gen_phase_field_conversion(inner_ty, quote! { __v });
                            return quote! {
                                (#access).map(|__v| #inner)
                            };
                        }
                    }
                    ("Vec", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner = gen_phase_field_conversion(inner_ty, quote! { __v });
                            return quote! {
                                (#access).into_iter().map(|__v| #inner).collect()
                            };
                        }
                    }
                    ("Box", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner = gen_phase_field_conversion(inner_ty, quote! { *#access });
                            return quote! { ::core::boxed::Box::new(#inner) };
                        }
                    }
                    _ => {}
                }
            }
            quote! { (#access).into() }
        }
        _ => quote! { (#access).into() },
    }
}

fn is_primitive_like(ident: &syn::Ident) -> bool {
    matches!(
        ident.to_string().as_str(),
        "bool"
            | "char"
            | "i8"
            | "i16"
            | "i32"
            | "i64"
            | "isize"
            | "u8"
            | "u16"
            | "u32"
            | "u64"
            | "usize"
            | "f32"
            | "f64"
            | "String"
    )
}
