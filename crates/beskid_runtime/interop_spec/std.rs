use beskid_abi::BeskidStr;

#[InteropCall(std::io, name = "print")]
fn sys_print(_text: *const BeskidStr) {}

#[InteropCall(std::io, name = "println")]
fn sys_println(_text: *const BeskidStr) {}

#[InteropCall(std::string, name = "len")]
fn str_len(_text: *const BeskidStr) -> usize {
    0
}
