use super::*;

#[test]
fn lib_target_defaults_to_shared_output() {
    assert_eq!(
        default_output_kind(Some(ProjectTargetKind::Lib)),
        BuildOutputKind::SharedLib
    );
}

#[test]
fn app_and_test_targets_default_to_executable_output() {
    assert_eq!(
        default_output_kind(Some(ProjectTargetKind::App)),
        BuildOutputKind::Exe
    );
    assert_eq!(
        default_output_kind(Some(ProjectTargetKind::Test)),
        BuildOutputKind::Exe
    );
}

#[test]
fn default_entrypoint_is_main_when_not_specified() {
    assert_eq!(
        resolve_entrypoint(None).expect("default entrypoint"),
        "main"
    );
}

#[test]
fn explicit_entrypoint_must_not_be_blank() {
    let err = resolve_entrypoint(Some("   ".to_owned())).expect_err("blank entrypoint should fail");
    assert!(matches!(err, AotError::InvalidRequest { .. }));
    assert!(err.to_string().contains("entrypoint must not be empty"));
}
