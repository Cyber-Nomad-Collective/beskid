use std::collections::HashSet;

use beskid_abi::{BUILTIN_SPECS, BeskidArray, BeskidStr};

#[test]
fn builtin_symbols_are_unique() {
    let set: HashSet<&'static str> = BUILTIN_SPECS.iter().map(|spec| spec.symbol).collect();
    assert_eq!(set.len(), BUILTIN_SPECS.len());
}

#[test]
fn ffi_types_have_stable_sizes() {
    assert_eq!(
        std::mem::size_of::<BeskidStr>(),
        std::mem::size_of::<usize>() * 2
    );
    assert_eq!(
        std::mem::size_of::<BeskidArray>(),
        std::mem::size_of::<usize>() * 3
    );
}
