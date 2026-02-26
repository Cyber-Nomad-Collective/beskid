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
