#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct BeskidStr {
    pub ptr: *const u8,
    pub len: usize,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct BeskidArray {
    pub ptr: *mut u8,
    pub len: usize,
    pub cap: usize,
}

use crate::gc::{
    drop_handle, store_handle, with_current_mutation_and_root, with_current_root, RawAllocation,
};

pub fn str_new(ptr: *const u8, len: usize) -> *mut BeskidStr {
    let size = std::mem::size_of::<BeskidStr>();
    let allocation = alloc(size, std::ptr::null());
    if allocation.is_null() {
        panic!("string allocation failed");
    }
    let target = allocation.cast::<BeskidStr>();
    unsafe {
        target.write(BeskidStr { ptr, len });
    }
    target
}

pub fn str_len(value: *const BeskidStr) -> usize {
    if value.is_null() {
        panic!("null string handle");
    }
    unsafe { (*value).len }
}

pub fn array_new(_elem_size: usize, len: usize) -> *mut BeskidArray {
    let size = std::mem::size_of::<BeskidArray>();
    let allocation = alloc(size, std::ptr::null());
    if allocation.is_null() {
        panic!("array allocation failed");
    }
    let target = allocation.cast::<BeskidArray>();
    unsafe {
        target.write(BeskidArray {
            ptr: std::ptr::null_mut(),
            len,
            cap: len,
        });
    }
    target
}

pub fn alloc(size: usize, type_desc_ptr: *const u8) -> *mut u8 {
    with_current_mutation_and_root(|mc, root| {
        let data = vec![0u8; size].into_boxed_slice();
        let allocation = RawAllocation { data };
        let gc_alloc = gc_arena::Gc::new(mc, allocation);
        let ptr = gc_alloc.data.as_ptr() as *mut u8;
        if !type_desc_ptr.is_null() {
            unsafe {
                std::ptr::write_unaligned(ptr.cast::<*const u8>(), type_desc_ptr);
            }
        }
        root.runtime_state.allocation_counter += 1;
        root.globals.push(gc_alloc);
        ptr
    })
}

pub fn gc_root_handle(value_ptr: *mut u8) -> u64 {
    with_current_root(|root| store_handle(root, value_ptr))
}

pub fn gc_unroot_handle(handle: u64) {
    with_current_root(|root| drop_handle(root, handle));
}

pub fn gc_register_root(ptr_addr: *mut *mut u8) {
    if ptr_addr.is_null() {
        return;
    }
    with_current_root(|root| {
        root.runtime_state.registered_roots.push(ptr_addr);
    });
}

pub fn gc_unregister_root(ptr_addr: *mut *mut u8) {
    if ptr_addr.is_null() {
        return;
    }
    with_current_root(|root| {
        root.runtime_state
            .registered_roots
            .retain(|entry| *entry != ptr_addr);
    });
}

pub fn gc_write_barrier(_dst_obj: *mut u8, _value_ptr: *mut u8) {}

pub fn panic(_msg_ptr: *const u8, _msg_len: usize) -> ! {
    panic!("beskid panic");
}

pub fn sys_print(value: *const BeskidStr) {
    if value.is_null() {
        panic!("null string handle");
    }
    let (ptr, len) = unsafe { ((*value).ptr, (*value).len) };
    if ptr.is_null() {
        panic!("null string data");
    }
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let text = std::str::from_utf8(bytes).unwrap_or("<invalid utf8>");
    print!("{text}");
}

pub fn sys_println(value: *const BeskidStr) {
    if value.is_null() {
        panic!("null string handle");
    }
    let (ptr, len) = unsafe { ((*value).ptr, (*value).len) };
    if ptr.is_null() {
        panic!("null string data");
    }
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let text = std::str::from_utf8(bytes).unwrap_or("<invalid utf8>");
    println!("{text}");
}

pub fn panic_str(value: *const BeskidStr) -> ! {
    if value.is_null() {
        panic!("null string handle");
    }
    let (ptr, len) = unsafe { ((*value).ptr, (*value).len) };
    if ptr.is_null() {
        panic!("null string data");
    }
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    let text = std::str::from_utf8(bytes).unwrap_or("<invalid utf8>");
    panic!("{text}");
}
