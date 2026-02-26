use beskid_abi::BeskidStr;

#[InteropCall("std.io")]
fn print(text: *const BeskidStr);

#[InteropCall("std.io")]
fn println(text: *const BeskidStr);

#[InteropCall("std.string")]
fn len(text: *const BeskidStr) -> usize;
