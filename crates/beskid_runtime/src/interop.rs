use crate::interop_generated;

#[unsafe(no_mangle)]
pub extern "C" fn interop_dispatch_unit(enum_ptr: *const u8) {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    if unsafe { interop_generated::dispatch_unit(tag, enum_ptr) } {
        return;
    }
    panic!("invalid interop tag for unit dispatch");
}

#[unsafe(no_mangle)]
pub extern "C" fn interop_dispatch_usize(enum_ptr: *const u8) -> usize {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    if let Some(value) = unsafe { interop_generated::dispatch_usize(tag, enum_ptr) } {
        return value;
    }
    panic!("invalid interop tag for usize dispatch");
}

#[unsafe(no_mangle)]
pub extern "C" fn interop_dispatch_ptr(enum_ptr: *const u8) -> *mut u8 {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    if let Some(value) = unsafe { interop_generated::dispatch_ptr(tag, enum_ptr) } {
        return value;
    }
    panic!("invalid interop tag for ptr dispatch");
}
