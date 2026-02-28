use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::codegen::util::lower_resolve_type;
use beskid_aot::{
    AotBuildRequest, BuildOutputKind, BuildProfile, ExportPolicy, LinkMode, RuntimeStrategy, build,
};
use beskid_codegen::lowering::lower_program;
use beskid_engine::Engine;

fn temp_case_dir(name: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time ok")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "beskid_parity_tests_{name}_{}_{}",
        std::process::id(),
        nanos
    ));
    std::fs::create_dir_all(&dir).expect("create temp dir");
    dir
}

fn compile_artifact(source: &str) -> beskid_codegen::CodegenArtifact {
    let (hir, resolution, typed) = lower_resolve_type(source);
    lower_program(&hir, &resolution, &typed).expect("expected codegen lowering to succeed")
}

fn jit_run_main_i64(source: &str) -> i64 {
    let artifact = compile_artifact(source);
    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");

    let ptr = unsafe { engine.entrypoint_ptr("main") }.expect("expected main entrypoint pointer");
    assert!(!ptr.is_null(), "expected non-null entrypoint pointer");
    let main_fn: extern "C" fn() -> i64 = unsafe { std::mem::transmute(ptr) };
    engine.with_arena(|_, _| main_fn())
}

fn build_aot_object(source: &str, output: PathBuf) -> PathBuf {
    let artifact = compile_artifact(source);
    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::ObjectOnly,
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
    .expect("expected AOT object build to succeed");

    result.object_path
}

fn object_contains_symbol(path: &Path, symbol: &str) -> bool {
    let output = Command::new("nm")
        .arg(path)
        .output()
        .expect("expected nm to inspect object file");
    assert!(output.status.success(), "expected nm to succeed");
    let text = String::from_utf8_lossy(&output.stdout);
    text.contains(symbol)
}

#[test]
fn parity_interop_usize_dispatch_path_is_consistent() {
    let source = "enum StdInterop { IoPrint(string text), IoPrintln(string text), StringLen(string text) } i64 main() { return __interop_dispatch_usize(StdInterop::StringLen(\"hello\")); }";
    let jit_value = jit_run_main_i64(source);
    assert_eq!(jit_value, 5, "expected JIT interop usize dispatch result");

    let dir = temp_case_dir("interop_usize");
    let object_path = build_aot_object(source, dir.join("parity.o"));
    assert!(
        object_contains_symbol(&object_path, "interop_dispatch_usize"),
        "expected AOT object to reference usize interop dispatch symbol"
    );

    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn parity_alloc_path_is_consistent() {
    let source = "i64 main() { return __array_new(8, 3); }";
    let jit_value = jit_run_main_i64(source);
    assert_ne!(
        jit_value, 0,
        "expected JIT alloc path to produce non-null pointer value"
    );

    let dir = temp_case_dir("array_new");
    let object_path = build_aot_object(source, dir.join("parity.o"));
    assert!(
        object_contains_symbol(&object_path, "array_new"),
        "expected AOT object to reference array_new runtime symbol"
    );

    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn parity_panic_builtin_compiles_for_both_backends() {
    let source = "unit main() { if false { __panic_str(\"boom\"); } }";
    let artifact = compile_artifact(source);

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed for panic builtin path");

    let dir = temp_case_dir("panic_builtin");
    let result = build(AotBuildRequest {
        artifact,
        output_kind: BuildOutputKind::ObjectOnly,
        output_path: dir.join("panic.o"),
        object_path: None,
        target_triple: None,
        profile: BuildProfile::Debug,
        entrypoint: "main".to_owned(),
        export_policy: ExportPolicy::PublicOnly,
        link_mode: LinkMode::Auto,
        runtime: RuntimeStrategy::BuildOnTheFly,
        verbose_link: false,
    })
    .expect("expected AOT compile to succeed for panic builtin path");

    assert!(
        result.object_path.exists(),
        "expected parity AOT object output"
    );
    let _ = std::fs::remove_dir_all(dir);
}
