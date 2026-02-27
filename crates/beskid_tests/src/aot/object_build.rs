use super::*;

#[test]
fn object_only_build_emits_object_file() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("object_only");
    let output = dir.join("sample.o");

    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::ObjectOnly,
        output_path: output.clone(),
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "main".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect("aot object build");

    assert!(result.object_path.exists(), "expected object file to exist");
    assert!(
        result.final_path.is_none(),
        "object-only build must not link"
    );

    let _ = std::fs::remove_dir_all(dir);
}
