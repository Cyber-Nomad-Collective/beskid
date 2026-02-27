use beskid_analysis::builtin_rules;

#[test]
fn builtin_semantic_rules_are_staged_only() {
    let rules = builtin_rules();
    assert_eq!(rules.len(), 1);
    assert_eq!(rules[0].name(), "semantic_pipeline");
}
