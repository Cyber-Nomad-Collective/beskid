pub mod diagnostics;
pub mod builtin;
pub mod rules;

pub use diagnostics::{span_to_sourcespan, SemanticDiagnostic, Severity};
pub use builtin::builtin_rules;
pub use rules::{AnalysisOptions, AnalysisResult, Rule, RuleContext, run_rules};
