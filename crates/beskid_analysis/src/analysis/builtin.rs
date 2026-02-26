use crate::analysis::rules::{Rule, staged::SemanticPipelineRule};

pub fn builtin_rules() -> Vec<Box<dyn Rule>> {
    vec![Box::new(SemanticPipelineRule)]
}
