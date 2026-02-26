use crate::analysis::rules::{staged::SemanticPipelineRule, Rule};

pub fn builtin_rules() -> Vec<Box<dyn Rule>> {
    vec![Box::new(SemanticPipelineRule)]
}
