use pecan_engine::Engine;
use pecan_codegen::lowering::lower_program;
use crate::codegen::util::lower_resolve_type;

#[test]
fn jit_compiles_simple_function() {
    let source = "i64 main() { return 1; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");
}

#[test]
fn jit_entrypoint_pointer_is_available() {
    let source = "i64 main() { return 2; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");

    let ptr = unsafe { engine.entrypoint_ptr("main") }
        .expect("expected entrypoint pointer");
    assert!(!ptr.is_null(), "expected a non-null entrypoint pointer");
}

#[test]
fn jit_compiles_println_builtin_call() {
    let source = "unit main() { std.io.println(\"hello\"); }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");
}
