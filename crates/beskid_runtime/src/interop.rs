use beskid_abi::BeskidStr;

use crate::builtins::{str_len, sys_print, sys_println};
use crate::interop_generated::{TAG_IO_PRINT, TAG_IO_PRINTLN, TAG_STRING_LEN};

#[unsafe(no_mangle)]
pub extern "C" fn interop_dispatch_unit(enum_ptr: *const u8) {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    match tag {
        TAG_IO_PRINT => {
            // IoPrint(string text)
            let text_ptr = unsafe { *(enum_ptr.add(16) as *const *const BeskidStr) };
            sys_print(text_ptr);
        }
        TAG_IO_PRINTLN => {
            // IoPrintln(string text)
            let text_ptr = unsafe { *(enum_ptr.add(16) as *const *const BeskidStr) };
            sys_println(text_ptr);
        }
        _ => panic!("invalid interop tag for unit dispatch"),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn interop_dispatch_usize(enum_ptr: *const u8) -> usize {
    let tag = unsafe { *(enum_ptr.add(8) as *const i32) };
    match tag {
        TAG_STRING_LEN => {
            // StringLen(string text)
            let text_ptr = unsafe { *(enum_ptr.add(16) as *const *const BeskidStr) };
            str_len(text_ptr)
        }
        _ => panic!("invalid interop tag for usize dispatch"),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn interop_dispatch_ptr(_enum_ptr: *const u8) -> *mut u8 {
    panic!("no ptr interop functions implemented yet")
}
