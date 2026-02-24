use pecan_engine::Engine;
use pecan_codegen::lowering::lower_program;
use crate::codegen::util::lower_resolve_type;

unsafe fn run_main_i64(engine: &mut Engine) -> i64 {
    let ptr = unsafe { engine.entrypoint_ptr("main") }
        .expect("expected main entrypoint pointer");
    assert!(!ptr.is_null(), "expected non-null entrypoint pointer");
    let main_fn: extern "C" fn() -> i64 = unsafe { std::mem::transmute(ptr) };
    engine.with_arena(|_, _| main_fn())
}

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
fn jit_executes_array_new_builtin_call() {
    let source = "i64 main() { return std.array.new(8, 3); }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");

    let value = unsafe { run_main_i64(&mut engine) };
    assert_ne!(value, 0, "expected array_new to return non-null pointer value");
}

#[test]
fn jit_executes_string_len_builtin_call() {
    let source = "i64 main() { return std.string.len(\"hello\"); }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 5, "expected string length builtin to return byte length");
}

#[test]
fn jit_executes_struct_allocation_and_returns_field() {
    let source = "type Boxed { i64 value } i64 main() { let b: Boxed = Boxed { value: 41 }; return b.value; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 41, "expected struct field value to round-trip");
}

#[test]
fn jit_compiles_std_panic_builtin_call() {
    let source = "unit main() { if false { std.panic(\"boom\"); } }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");
}

#[test]
fn jit_executes_enum_allocation_and_returns_payload_field() {
    let source = "enum Choice { Some(i32 value), None } i32 main() { let c: Choice = Choice::Some(7); let result: i32 = match c { Choice::Some(v) => v, Choice::None => 0, }; return result; }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let mut engine = Engine::new();
    engine
        .compile_artifact(&artifact)
        .expect("expected JIT compile to succeed");

    let ptr = unsafe { engine.entrypoint_ptr("main") }.expect("ptr");
    let value = engine.with_arena(|_, _| {
        let main_fn: extern "C" fn() -> i32 = unsafe { std::mem::transmute(ptr) };
        main_fn()
    });
    assert_eq!(value, 7, "expected enum payload field to round-trip");
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
