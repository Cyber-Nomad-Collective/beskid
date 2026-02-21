use proc_macro::TokenStream;
use quote::{format_ident, quote};
use syn::{
    parse_macro_input, Attribute, Data, DeriveInput, Fields, GenericArgument, LitStr, PathArguments,
    Type,
};

#[proc_macro_derive(AstNode, attributes(ast))]
pub fn derive_ast_node(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = input.ident;
    let kind_ident = parse_kind_attr(&input.attrs).unwrap_or_else(|| name.clone());

    let children_body = match &input.data {
        Data::Struct(ds) => gen_struct_children(ds.fields.iter().collect::<Vec<_>>()),
        Data::Enum(en) => gen_enum_children(en.variants.iter().collect::<Vec<_>>()),
        Data::Union(_) => quote! {},
    };

    let expanded = quote! {
        #[allow(unused_variables)]
        impl crate::query::AstNode for #name {
            fn as_any(&self) -> &dyn ::core::any::Any { self }
            fn children<'a>(&'a self, push: &mut dyn FnMut(crate::query::DynNodeRef<'a>)) {
                #children_body
            }
            fn node_kind(&self) -> crate::query::NodeKind {
                crate::query::NodeKind::#kind_ident
            }
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

fn gen_struct_children(fields: Vec<&syn::Field>) -> proc_macro2::TokenStream {
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
        stmts.push(gen_push_for_type(&field.ty, access));
    }
    quote! { #(#stmts)* }
}

fn gen_enum_children(variants: Vec<&syn::Variant>) -> proc_macro2::TokenStream {
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
                    stmts.push(gen_push_for_type(&field.ty, quote! { #binding }));
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
                    stmts.push(gen_push_for_type(&field.ty, quote! { #fname }));
                }
                arms.push(quote! { Self::#vident { #(#binds),* } => { #(#stmts)* } });
            }
        }
    }
    quote! { match self { #( #arms ),* } }
}

fn gen_push_for_type(ty: &Type, access: proc_macro2::TokenStream) -> proc_macro2::TokenStream {
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
                            let inner = gen_push_for_type(inner_ty, quote! { #v });
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
                            let inner = gen_push_for_type(inner_ty, quote! { #v });
                            return quote! {
                                for #v in (#access).iter() {
                                    #inner
                                }
                            };
                        }
                    }
                    ("Box", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner = gen_push_for_type(inner_ty, quote! { (#access).as_ref() });
                            return quote! { #inner };
                        }
                    }
                    ("Spanned", PathArguments::AngleBracketed(ab)) => {
                        if let Some(GenericArgument::Type(inner_ty)) = ab.args.first() {
                            let inner_access = quote! { &((#access).node) };
                            return gen_push_for_type(inner_ty, inner_access);
                        }
                    }
                    _ => {}
                }
                if is_primitive_like(ident) {
                    return quote! {};
                }
            }
            quote! {
                let __n: &'a dyn crate::query::AstNode = #access;
                push(crate::query::DynNodeRef(__n));
            }
        }
        _ => quote! {},
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
