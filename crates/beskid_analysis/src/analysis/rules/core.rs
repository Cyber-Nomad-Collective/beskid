use super::super::diagnostics::{make_diagnostic, SemanticDiagnostic, Severity};
use crate::syntax::Program;

#[derive(Debug, Clone)]
pub struct AnalysisOptions {
    pub emit_warnings: bool,
}

impl Default for AnalysisOptions {
    fn default() -> Self {
        Self {
            emit_warnings: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct AnalysisResult {
    pub diagnostics: Vec<SemanticDiagnostic>,
}

pub trait Rule {
    fn name(&self) -> &'static str;
    fn run(&self, ctx: &mut RuleContext, program: &Program);
}

pub struct RuleContext {
    source_name: String,
    source: String,
    pub diagnostics: Vec<SemanticDiagnostic>,
    pub options: AnalysisOptions,
}

impl RuleContext {
    pub fn new(
        source_name: impl Into<String>,
        source: impl Into<String>,
        options: AnalysisOptions,
    ) -> Self {
        Self {
            source_name: source_name.into(),
            source: source.into(),
            diagnostics: Vec::new(),
            options,
        }
    }

    pub fn source_name(&self) -> &str {
        &self.source_name
    }

    pub fn source(&self) -> &str {
        &self.source
    }

    pub fn emit(&mut self, diagnostic: SemanticDiagnostic) {
        if matches!(diagnostic.severity, Severity::Warning) && !self.options.emit_warnings {
            return;
        }

        self.diagnostics.push(diagnostic);
    }

    pub fn emit_simple(
        &mut self,
        span: crate::syntax::SpanInfo,
        code: impl Into<String>,
        message: impl Into<String>,
        label: impl Into<String>,
        help: Option<String>,
        severity: Severity,
    ) {
        let diagnostic = make_diagnostic(
            &self.source_name,
            &self.source,
            span,
            message,
            label,
            help,
            Some(code.into()),
            severity,
        );
        self.emit(diagnostic);
    }
}

pub fn run_rules(
    program: &Program,
    source_name: impl Into<String>,
    source: impl Into<String>,
    rules: &[Box<dyn Rule>],
    options: AnalysisOptions,
) -> AnalysisResult {
    let mut ctx = RuleContext::new(source_name, source, options);

    for rule in rules {
        rule.run(&mut ctx, program);
    }

    AnalysisResult {
        diagnostics: ctx.diagnostics,
    }
}
