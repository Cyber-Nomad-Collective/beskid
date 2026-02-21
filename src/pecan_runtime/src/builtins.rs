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

pub fn panic(_msg_ptr: *const u8, _msg_len: usize) -> ! {
    panic!("pecan panic");
}
