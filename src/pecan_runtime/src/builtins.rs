#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct PecanStr {
    pub ptr: *const u8,
    pub len: usize,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct PecanArray {
    pub ptr: *mut u8,
    pub len: usize,
    pub cap: usize,
}

use crate::gc::{
    drop_handle, store_handle, with_current_mutation_and_root, with_current_root, RawAllocation,
};

pub fn str_new(ptr: *const u8, len: usize) -> PecanStr {
    PecanStr { ptr, len }
}

pub fn str_len(value: PecanStr) -> usize {
    value.len
}

pub fn array_new(_elem_size: usize, len: usize) -> PecanArray {
    PecanArray {
        ptr: std::ptr::null_mut(),
        len,
        cap: len,
    }
}

pub fn alloc(size: usize, _type_desc_ptr: *const u8) -> *mut u8 {
    with_current_mutation_and_root(|mc, root| {
        let data = vec![0u8; size].into_boxed_slice();
        let allocation = RawAllocation { data };
        let gc_alloc = gc_arena::Gc::new(mc, allocation);
        let ptr = gc_alloc.data.as_ptr() as *mut u8;
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

pub fn gc_register_root(_ptr_addr: *mut *mut u8) {}

pub fn gc_unregister_root(_ptr_addr: *mut *mut u8) {}

pub fn gc_write_barrier(_dst_obj: *mut u8, _value_ptr: *mut u8) {}

pub fn panic(_msg_ptr: *const u8, _msg_len: usize) -> ! {
    panic!("pecan panic");
}
