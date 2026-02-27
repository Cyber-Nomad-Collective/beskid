use super::*;

#[test]
fn executable_build_rejects_empty_entrypoint() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("entrypoint_required_exe");
    let output = dir.join("sample");

    let err = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::Exe,
        output_path: output,
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "   ".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect_err("blank entrypoint for executable should fail");

    assert!(matches!(err, AotError::InvalidRequest { .. }));
    assert!(err.to_string().contains("entrypoint must not be empty"));
    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn object_only_build_allows_empty_entrypoint() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("entrypoint_not_required_object");
    let output = dir.join("sample.o");

    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::ObjectOnly,
        output_path: output,
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "   ".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect("object-only build should not require entrypoint");

    assert!(result.object_path.exists(), "expected object file to exist");
    assert!(result.final_path.is_none(), "object-only should not produce final output");
    let _ = std::fs::remove_dir_all(dir);
}
