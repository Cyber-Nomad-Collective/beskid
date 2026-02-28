use super::*;

#[test]
fn static_build_contains_required_runtime_symbols() {
    let artifact = lower_sample_artifact();
    let dir = temp_case_dir("static_with_runtime_symbols");
    let output = dir.join("libsample.a");

    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::StaticLib,
        output_path: output,
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "main".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect("aot static build");

    let final_path = result
        .final_path
        .expect("static build should emit final archive");
    assert!(
        final_path.exists(),
        "expected final static archive to exist"
    );

    let output = Command::new("nm")
        .arg("-g")
        .arg(&final_path)
        .output()
        .expect("nm should inspect linked archive");
    assert!(output.status.success(), "expected nm to succeed");
    let symbols = String::from_utf8_lossy(&output.stdout);
    assert!(
        symbols.contains(SYM_ABI_VERSION),
        "expected final static artifact to expose ABI version symbol"
    );
    assert!(
        symbols.contains(SYM_INTEROP_DISPATCH_UNIT),
        "expected final static artifact to expose interop dispatch symbol"
    );

    let _ = std::fs::remove_dir_all(dir);
}
