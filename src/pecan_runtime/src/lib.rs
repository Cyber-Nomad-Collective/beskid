//! Runtime support for Pecan (allocation, builtins, GC hooks).

pub mod builtins;
pub mod gc;

pub use builtins::{
    alloc, array_new, gc_register_root, gc_root_handle, gc_unregister_root, gc_unroot_handle,
    gc_write_barrier, panic, panic_str, str_len, str_new, sys_print, sys_println,
};
pub use gc::{
    clear_current_mutation, clear_current_root, set_current_mutation, set_current_root,
    with_current_mutation, with_current_root, RawAllocation, RuntimeRoot, RuntimeState,
};
