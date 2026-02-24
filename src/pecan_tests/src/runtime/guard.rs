use pecan_runtime::{gc_register_root, gc_unregister_root, gc_write_barrier};

#[test]
fn runtime_write_barrier_is_noop() {
    gc_write_barrier(std::ptr::null_mut(), std::ptr::null_mut());
}

#[test]
fn runtime_register_unregister_root_are_noops() {
    gc_register_root(std::ptr::null_mut());
    gc_unregister_root(std::ptr::null_mut());
}
