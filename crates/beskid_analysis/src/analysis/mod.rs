pub mod builtin;
pub mod diagnostics;
pub mod rules;

pub use builtin::builtin_rules;
pub use diagnostics::{SemanticDiagnostic, Severity, span_to_sourcespan};
pub use rules::{AnalysisOptions, AnalysisResult, Rule, RuleContext, run_rules};
