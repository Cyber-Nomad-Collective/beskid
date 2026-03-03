use crate::codegen::util::lower_resolve_type;
use beskid_codegen::lowering::lower_program;
use beskid_engine::Engine;
use std::panic::{self, AssertUnwindSafe};

macro_rules! run_entrypoint0 {
    ($engine:expr, $entrypoint:expr, $ret:ty) => {{
        // SAFETY: helper is used only with known test signatures.
        unsafe { execute_entrypoint0::<$ret>($engine, $entrypoint) }
    }};
}

unsafe fn execute_entrypoint0<R>(engine: &mut Engine, entrypoint: &str) -> R {
    let ptr = unsafe { engine.entrypoint_ptr(entrypoint) }.expect("expected entrypoint pointer");
    assert!(!ptr.is_null(), "expected non-null entrypoint pointer");
    engine.with_arena(|_, _| {
        // SAFETY: tests provide the expected return type for the compiled entrypoint.
        unsafe { invoke0::<R>(ptr) }
    })
}

unsafe fn invoke0<R>(ptr: *const u8) -> R {
    let callable: extern "C" fn() -> R = unsafe { std::mem::transmute(ptr) };
    callable()
}

unsafe fn run_main_i64(engine: &mut Engine) -> i64 {
    run_entrypoint0!(engine, "main", i64)
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
    let source = "i64 main() { return __str_len(\"hello\"); }";
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

    let value = run_entrypoint0!(&mut engine, "main", i32);
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
    let source = "unit main() { __sys_println(\"hello\"); }";
    compile_jit(source);
}

#[test]
fn jit_executes_local_lambda_call() {
    let source = "i64 main() { let add = (x: i64, y: i64) => x + y; return add(20, 22); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 42, "expected local lambda to be callable");
}

#[test]
fn jit_executes_closure_capture_call() {
    let source = "i64 main() { i64 base = 41; let inc = (x: i64) => x + base; return inc(1); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 42, "expected lambda closure to capture outer local");
}

#[test]
fn jit_passes_lambda_as_argument_to_lambda() {
    let source = "i64 main() { let apply = (f: i64(i64), x: i64) => f(x); let id = (n: i64) => n; return apply(id, 42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 42, "expected lambda argument passing to work");
}

#[test]
fn jit_executes_grouped_immediate_lambda_call() {
    let source = "i64 main() { return ((x: i64) => x)(42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 42, "expected grouped lambda immediate call to work");
}

#[test]
fn jit_passes_inline_lambda_argument() {
    let source = "i64 main() { let apply = (f: i64(i64), x: i64) => f(x); return apply((n: i64) => n, 42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 42, "expected inline lambda argument passing to work");
}

#[test]
fn jit_passes_inline_lambda_to_named_function() {
    let source = "i64 apply(f: i64(i64), x: i64) { return f(x); } i64 main() { return apply((n: i64) => n, 42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 42,
        "expected named function to call inline lambda argument"
    );
}

#[test]
fn jit_passes_local_lambda_to_named_function() {
    let source = "i64 apply(f: i64(i64), x: i64) { return f(x); } i64 main() { let inc = (n: i64) => n; return apply(inc, 42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 42,
        "expected named function to call local lambda argument"
    );
}

#[test]
fn jit_calls_function_typed_member_value() {
    let source = "type Holder { i64(i64) f } i64 main() { Holder h = Holder { f: (n: i64) => n }; return h.f(42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(value, 42, "expected function-typed member call to work");
}

#[test]
fn jit_infers_lambda_parameter_type_from_typed_let() {
    let source = "i64 main() { i64(i64) id = (n) => n; return id(42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 42,
        "expected lambda parameter type inference from typed let"
    );
}

#[test]
fn jit_infers_lambda_parameter_type_from_named_function_argument() {
    let source = "i64 apply(i64(i64) f, i64 x) { return f(x); } i64 main() { return apply((n) => n, 42); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 42,
        "expected lambda parameter type inference from function argument"
    );
}

#[test]
fn jit_executes_method_call_with_this_field_access() {
    let source =
        "type Counter { i64 value } i64 Counter.Get() { return this.value; } i64 main() { Counter c = Counter { value: 42 }; return c.Get(); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 42,
        "expected method call to read receiver field via this"
    );
}

#[test]
fn jit_dispatches_same_method_name_by_receiver_type() {
    let source = "type A { i64 value } type B { i64 value } i64 A.Get() { return this.value; } i64 B.Get() { return this.value + 1; } i64 main() { A a = A { value: 20 }; B b = B { value: 21 }; return a.Get() + b.Get(); }";
    let mut engine = compile_jit(source);

    let value = unsafe { run_main_i64(&mut engine) };
    assert_eq!(
        value, 42,
        "expected receiver-specific method dispatch to call matching method body"
    );
}
