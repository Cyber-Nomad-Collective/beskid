use crate::builtins::{PecanStr, sys_print, sys_println, str_len};

pub extern "C" fn interop_dispatch_unit(enum_ptr: *const u8) {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    match tag {
        0 => { // IoPrint(string text)
            let text_ptr = unsafe { *(enum_ptr.add(16) as *const *const PecanStr) };
            sys_print(text_ptr);
        }
        1 => { // IoPrintln(string text)
            let text_ptr = unsafe { *(enum_ptr.add(16) as *const *const PecanStr) };
            sys_println(text_ptr);
        }
        _ => panic!("invalid interop tag for unit dispatch"),
    }
}

pub extern "C" fn interop_dispatch_usize(enum_ptr: *const u8) -> usize {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    match tag {
        2 => { // StringLen(string text)
            let text_ptr = unsafe { *(enum_ptr.add(16) as *const *const PecanStr) };
            str_len(text_ptr)
        }
        _ => panic!("invalid interop tag for usize dispatch"),
    }
}

pub extern "C" fn interop_dispatch_ptr(_enum_ptr: *const u8) -> *mut u8 {
    panic!("no ptr interop functions implemented yet")
}
