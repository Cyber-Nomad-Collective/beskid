use beskid_engine::Engine;
use beskid_runtime::{alloc, gc_root_handle, gc_unroot_handle};

#[test]
fn runtime_alloc_and_root_handle_roundtrip() {
    let mut engine = Engine::new();
    engine.with_arena(|_, _| {
        let ptr = alloc(16, std::ptr::null());
        assert!(!ptr.is_null(), "expected alloc to return non-null pointer");
        let handle = gc_root_handle(ptr);
        assert_eq!(handle, 0, "expected first handle to be zero");
        gc_unroot_handle(handle);
    });
}

#[test]
fn runtime_multiple_handles_are_distinct() {
    let mut engine = Engine::new();
    engine.with_arena(|_, _| {
        let first = alloc(8, std::ptr::null());
        let second = alloc(8, std::ptr::null());
        let h1 = gc_root_handle(first);
        let h2 = gc_root_handle(second);
        assert_ne!(h1, h2, "expected unique handles for distinct roots");
        gc_unroot_handle(h1);
        gc_unroot_handle(h2);
    });
}

#[test]
fn runtime_alloc_is_zeroed() {
    let mut engine = Engine::new();
    engine.with_arena(|_, _| {
        let ptr = alloc(16, std::ptr::null());
        let slice = unsafe { std::slice::from_raw_parts(ptr, 16) };
        assert!(slice.iter().all(|byte| *byte == 0));
    });
}

#[test]
fn runtime_root_handle_survives_additional_allocs() {
    let mut engine = Engine::new();
    engine.with_arena(|_, _| {
        let ptr = alloc(8, std::ptr::null());
        let handle = gc_root_handle(ptr);
        let _ = alloc(8, std::ptr::null());
        let _ = alloc(8, std::ptr::null());
        assert_eq!(handle, 0, "expected first handle to remain stable");
        gc_unroot_handle(handle);
    });
}
