pub mod diagnostics;
pub mod rules;

pub use diagnostics::{span_to_sourcespan, SemanticDiagnostic, Severity};
pub use rules::{AnalysisOptions, AnalysisResult, Rule, RuleContext, run_rules};
