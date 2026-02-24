use pecan_engine::Engine;
use pecan_runtime::{alloc, gc_register_root, gc_root_handle, gc_unregister_root, gc_write_barrier};

#[test]
fn runtime_write_barrier_is_noop() {
    let mut engine = Engine::new();
    engine.with_arena(|_, _| {
        gc_write_barrier(std::ptr::null_mut(), std::ptr::null_mut());
    });
}

#[test]
fn runtime_register_unregister_root_are_noops() {
    let mut engine = Engine::new();
    engine.with_arena(|_, root| {
        let mut value = std::ptr::null_mut();
        let value_ptr = &mut value as *mut *mut u8;
        gc_register_root(value_ptr);
        assert_eq!(root.runtime_state.registered_roots.len(), 1);
        gc_unregister_root(value_ptr);
        assert!(root.runtime_state.registered_roots.is_empty());
    });
}

#[test]
fn runtime_alloc_panics_without_arena_scope() {
    let result = std::panic::catch_unwind(|| {
        let _ = alloc(8, std::ptr::null());
    });
    assert!(result.is_err(), "expected alloc to panic without arena scope");
}

#[test]
fn runtime_root_handle_panics_without_arena_scope() {
    let result = std::panic::catch_unwind(|| {
        let _ = gc_root_handle(std::ptr::null_mut());
    });
    assert!(
        result.is_err(),
        "expected gc_root_handle to panic without arena scope"
    );
}
