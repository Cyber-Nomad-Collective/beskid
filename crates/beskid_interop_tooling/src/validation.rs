use crate::model::InteropDecl;
use anyhow::Result;
use std::collections::BTreeSet;

pub trait InteropContractValidator {
    fn validate_declarations(&self, decls: &[InteropDecl]) -> Result<()>;
}

#[derive(Debug, Default, Clone, Copy)]
pub struct AstContractValidator;

impl InteropContractValidator for AstContractValidator {
    fn validate_declarations(&self, decls: &[InteropDecl]) -> Result<()> {
        validate_declarations_ast(decls)
    }
}

pub fn validate_declarations_ast(decls: &[InteropDecl]) -> Result<()> {
    let mut seen = BTreeSet::new();
    for decl in decls {
        if !decl.module_path.starts_with("std.") {
            anyhow::bail!(
                "{}:{} invalid module path `{}` (must start with `std.`)",
                decl.source.display(),
                decl.line,
                decl.module_path
            );
        }

        let key = format!("{}::{}", decl.module_path, decl.function_name);
        if !seen.insert(key.clone()) {
            anyhow::bail!(
                "duplicate interop declaration `{}` at {}:{}",
                key,
                decl.source.display(),
                decl.line
            );
        }
    }
    Ok(())
}

pub fn validate_declarations(decls: &[InteropDecl]) -> Result<()> {
    AstContractValidator.validate_declarations(decls)
}
