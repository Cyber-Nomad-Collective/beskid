use std::path::Path;

use anyhow::Result;
use beskid_analysis::analysis::diagnostics::{SemanticDiagnostic, Severity};
use beskid_analysis::hir::{
    AstProgram, HirProgram, lower_program as lower_hir_program, normalize_program,
};
use beskid_analysis::resolve::{Resolution, Resolver};
use beskid_analysis::syntax::Spanned;
use beskid_analysis::types::{TypeResult, type_program};
use beskid_analysis::{AnalysisOptions, builtin_rules, run_rules};

use crate::{CodegenArtifact, codegen_errors_to_diagnostics, lower_program};

pub struct LoweredProgram {
    pub hir: Spanned<HirProgram>,
    pub resolution: Resolution,
    pub typed: TypeResult,
    pub artifact: CodegenArtifact,
}

pub fn lower_source(path: &Path, source: &str, with_diagnostics: bool) -> Result<LoweredProgram> {
    let program = beskid_analysis::services::parse_program(source)?;

    if with_diagnostics {
        let diagnostics = run_rules(
            &program.node,
            path.display().to_string(),
            source,
            &builtin_rules(),
            AnalysisOptions::default(),
        )
        .diagnostics;
        ensure_no_analysis_errors(&diagnostics)?;
    }

    let ast: Spanned<AstProgram> = program.into();
    let mut hir: Spanned<HirProgram> = lower_hir_program(&ast);
    normalize_program(&mut hir)
        .map_err(|errors| anyhow::anyhow!("Normalization failed: {errors:?}"))?;

    let resolution = Resolver::new()
        .resolve_program(&hir)
        .map_err(|errors| anyhow::anyhow!("Resolution failed: {errors:?}"))?;
    let typed = type_program(&hir, &resolution)
        .map_err(|errors| anyhow::anyhow!("Type checking failed: {errors:?}"))?;

    let artifact = lower_program(&hir, &resolution, &typed).map_err(|errors| {
        let diagnostics =
            codegen_errors_to_diagnostics(&path.display().to_string(), source, &errors);
        anyhow::anyhow!(
            diagnostics
                .into_iter()
                .map(|diag| format!("{diag:?}"))
                .collect::<Vec<_>>()
                .join("\n")
        )
    })?;

    Ok(LoweredProgram {
        hir,
        resolution,
        typed,
        artifact,
    })
}

pub fn render_clif(artifact: &CodegenArtifact) -> String {
    let mut out = String::new();
    for function in &artifact.functions {
        out.push_str(&format!(";; Function: {}\n", function.name));
        out.push_str(&function.function.to_string());
        out.push('\n');
    }
    out
}

fn ensure_no_analysis_errors(diagnostics: &[SemanticDiagnostic]) -> Result<()> {
    let has_errors = diagnostics
        .iter()
        .any(|diagnostic| matches!(diagnostic.severity, Severity::Error));
    if has_errors {
        return Err(anyhow::anyhow!(
            diagnostics
                .iter()
                .map(|diag| format!("{diag:?}"))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    Ok(())
}
