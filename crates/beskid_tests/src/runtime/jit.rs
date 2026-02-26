use crate::codegen::util::lower_resolve_type;
use beskid_codegen::lowering::lower_program;
use beskid_engine::Engine;
use std::panic::{self, AssertUnwindSafe};

unsafe fn run_main_i64(engine: &mut Engine) -> i64 {
    let ptr = unsafe { engine.entrypoint_ptr("main") }.expect("expected main entrypoint pointer");
    assert!(!ptr.is_null(), "expected non-null entrypoint pointer");
    let main_fn: extern "C" fn() -> i64 = unsafe { std::mem::transmute(ptr) };
    engine.with_arena(|_, _| main_fn())
}

fn compile_jit(source: &str) -> Engine {
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact =
        lower_program(&hir, &resolution, &typed).expect("expected codegen lowering to succeed");
    let func_names: Vec<String> = artifact
        .functions
        .iter()
        .map(|func| func.name.clone())
        .collect();

    let mut engine = Engine::new();
    let compile_result = panic::catch_unwind(AssertUnwindSafe(|| {
        engine
            .compile_artifact(&artifact)
            .expect("expected JIT compile to succeed");
    }));

    if let Err(payload) = compile_result {
        eprintln!("JIT compile panicked for source: {source}");
        eprintln!("JIT artifact functions: {func_names:?}");
        panic::resume_unwind(payload);
    }

    engine
}

#[test]
fn jit_compiles_simple_function() {
    let source = "i64 main() { return 1; }";
    compile_jit(source);
}

#[test]
fn jit_executes_array_new_builtin_call() {
    let source = "i64 main() { return __array_new(8, 3); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_ne!(
        value, 0,
        "expected array_new to return non-null pointer value"
    );
}

#[test]
fn jit_executes_string_len_builtin_call() {
    let source = "enum StdInterop { IoPrint(string text), IoPrintln(string text), StringLen(string text) } i64 main() { return __interop_dispatch_usize(StdInterop::StringLen(\"hello\")); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 5,
        "expected string length builtin to return byte length"
    );
}

#[test]
fn jit_executes_struct_allocation_and_returns_field() {
    let source =
        "type Boxed { i64 value } i64 main() { Boxed b = Boxed { value: 41 }; return b.value; }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 41, "expected struct field value to round-trip");
}

#[test]
fn jit_compiles_std_panic_builtin_call() {
    let source = "unit main() { if false { __panic_str(\"boom\"); } }";
    compile_jit(source);
}

#[test]
fn jit_executes_enum_allocation_and_returns_payload_field() {
    let source = "enum Choice { Some(i32 value), None } i32 main() { Choice c = Choice::Some(7); i32 result = match c { Choice::Some(v) => v, Choice::None => 0, }; return result; }";
    let mut engine = compile_jit(source);

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
    let mut engine = compile_jit(source);

    let ptr = unsafe { engine.entrypoint_ptr("main") }.expect("expected entrypoint pointer");
    assert!(!ptr.is_null(), "expected a non-null entrypoint pointer");
}

#[test]
fn jit_compiles_println_builtin_call() {
    let source = "enum StdInterop { IoPrintln(string text) } unit main() { __interop_dispatch_unit(StdInterop::IoPrintln(\"hello\")); }";
    compile_jit(source);
}
