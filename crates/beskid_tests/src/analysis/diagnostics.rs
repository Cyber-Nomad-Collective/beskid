use beskid_analysis::Severity;
use beskid_analysis::analysis::SemanticIssueKind;
use beskid_analysis::syntax::SpanInfo;

fn span() -> SpanInfo {
    SpanInfo {
        start: 1,
        end: 2,
        line_col_start: (3, 4),
        line_col_end: (3, 5),
    }
}

#[test]
fn resolve_private_item_issue_contract_is_stable() {
    let issue = SemanticIssueKind::ResolvePrivateItemInModule {
        module_path: "foo.bar".to_string(),
        name: "baz".to_string(),
    };
    assert_eq!(issue.code(), "E1107");
    assert_eq!(issue.severity(), Severity::Error);
    assert!(issue.message().contains("private item `baz`"));
    assert!(issue.help().is_some());
}

#[test]
fn duplicate_definition_uses_previous_span_help() {
    let issue = SemanticIssueKind::DuplicateDefinitionName {
        name: "User".to_string(),
        previous: span(),
    };
    assert_eq!(issue.code(), "E1001");
    assert_eq!(issue.severity(), Severity::Error);
    assert!(issue.message().contains("duplicate definition name `User`"));
    assert_eq!(
        issue.help().as_deref(),
        Some("previously defined at line 3, column 4")
    );
}

#[test]
fn warning_issue_contract_is_stable() {
    let issue = SemanticIssueKind::TypeImplicitNumericCast {
        from: "i64".to_string(),
        to: "i32".to_string(),
    };
    assert_eq!(issue.code(), "W1203");
    assert_eq!(issue.severity(), Severity::Warning);
    assert_eq!(issue.label(), "implicit numeric cast");
    assert!(
        issue
            .message()
            .contains("implicit numeric cast from i64 to i32")
    );
    assert!(issue.help().is_some());
}
