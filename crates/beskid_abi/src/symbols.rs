pub const SYM_ABI_VERSION: &str = "beskid_runtime_abi_version";
pub const SYM_ALLOC: &str = "alloc";
pub const SYM_STR_NEW: &str = "str_new";
pub const SYM_ARRAY_NEW: &str = "array_new";
pub const SYM_PANIC: &str = "panic";
pub const SYM_PANIC_STR: &str = "panic_str";
pub const SYM_STR_LEN: &str = "str_len";
pub const SYM_GC_WRITE_BARRIER: &str = "gc_write_barrier";
pub const SYM_GC_ROOT_HANDLE: &str = "gc_root_handle";
pub const SYM_GC_UNROOT_HANDLE: &str = "gc_unroot_handle";
pub const SYM_GC_REGISTER_ROOT: &str = "gc_register_root";
pub const SYM_GC_UNREGISTER_ROOT: &str = "gc_unregister_root";
pub const SYM_INTEROP_DISPATCH_UNIT: &str = "interop_dispatch_unit";
pub const SYM_INTEROP_DISPATCH_PTR: &str = "interop_dispatch_ptr";
pub const SYM_INTEROP_DISPATCH_USIZE: &str = "interop_dispatch_usize";

pub const RUNTIME_EXPORT_SYMBOLS: &[&str] = &[
    SYM_ABI_VERSION,
    SYM_ALLOC,
    SYM_STR_NEW,
    SYM_STR_LEN,
    SYM_ARRAY_NEW,
    SYM_PANIC,
    SYM_PANIC_STR,
    SYM_GC_WRITE_BARRIER,
    SYM_GC_ROOT_HANDLE,
    SYM_GC_UNROOT_HANDLE,
    SYM_GC_REGISTER_ROOT,
    SYM_GC_UNREGISTER_ROOT,
    SYM_INTEROP_DISPATCH_UNIT,
    SYM_INTEROP_DISPATCH_PTR,
    SYM_INTEROP_DISPATCH_USIZE,
];
