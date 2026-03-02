use super::*;

#[test]
fn executable_build_succeeds_in_standalone_mode() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("standalone_executable");
    let output = dir.join("sample_standalone");

    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::Exe,
        output_path: output,
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "main".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::Standalone,
        verbose_link: false,
    })
    .expect("standalone executable build");

    let final_path = result
        .final_path
        .expect("executable build should emit final output");
    assert!(
        final_path.exists(),
        "expected standalone executable to exist"
    );

    let _ = std::fs::remove_dir_all(dir);
}
