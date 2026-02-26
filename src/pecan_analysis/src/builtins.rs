use std::collections::HashMap;

use crate::resolve::ItemId;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuiltinType {
    String,
    Ptr,
    Usize,
    U64,
    Unit,
    Never,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BuiltinSpec {
    pub pecan_path: &'static [&'static str],
    pub runtime_symbol: &'static str,
    pub params: &'static [BuiltinType],
    pub returns: BuiltinType,
    pub injected: bool,
}

#[macro_export]
macro_rules! define_builtins {
    ($($path:expr => {
        symbol: $symbol:literal,
        params: [$($param:ident),* $(,)?],
        returns: $returns:ident,
        injected: $injected:expr $(,)?
    }),* $(,)?) => {
        const BUILTINS: &[$crate::builtins::BuiltinSpec] = &[
            $(
                $crate::builtins::BuiltinSpec {
                    pecan_path: $path,
                    runtime_symbol: $symbol,
                    params: &[$($crate::builtins::BuiltinType::$param),*],
                    returns: $crate::builtins::BuiltinType::$returns,
                    injected: $injected,
                },
            )*
        ];
    };
}

pub fn builtin_specs() -> &'static [BuiltinSpec] {
    BUILTINS
}

pub fn builtin_for_path(path: &[String]) -> Option<(usize, &'static BuiltinSpec)> {
    for (index, spec) in BUILTINS.iter().enumerate() {
        if path_matches(spec.pecan_path, path) {
            return Some((index, spec));
        }
    }
    None
}

pub fn builtin_for_item(
    builtin_items: &HashMap<ItemId, usize>,
    item_id: ItemId,
) -> Option<&'static BuiltinSpec> {
    builtin_items
        .get(&item_id)
        .and_then(|index| BUILTINS.get(*index))
}

fn path_matches(expected: &[&str], actual: &[String]) -> bool {
    if expected.len() != actual.len() {
        return false;
    }
    expected
        .iter()
        .zip(actual.iter())
        .all(|(left, right)| *left == right)
}

define_builtins! {
    &["std", "io", "print"] => {
        symbol: "sys_print",
        params: [String],
        returns: Unit,
        injected: false,
    },
    &["std", "io", "println"] => {
        symbol: "sys_println",
        params: [String],
        returns: Unit,
        injected: false,
    },
    &["std", "panic"] => {
        symbol: "panic_str",
        params: [String],
        returns: Never,
        injected: false,
    },
    &["std", "string", "len"] => {
        symbol: "str_len",
        params: [String],
        returns: Usize,
        injected: false,
    },
    &["std", "array", "new"] => {
        symbol: "array_new",
        params: [Usize, Usize],
        returns: Usize,
        injected: false,
    },
    &["__alloc"] => {
        symbol: "alloc",
        params: [Usize, Ptr],
        returns: Ptr,
        injected: true,
    },
    &["__str_new"] => {
        symbol: "str_new",
        params: [Ptr, Usize],
        returns: Ptr,
        injected: true,
    },
    &["__array_new"] => {
        symbol: "array_new",
        params: [Usize, Usize],
        returns: Ptr,
        injected: true,
    },
    &["__gc_write_barrier"] => {
        symbol: "gc_write_barrier",
        params: [Ptr, Ptr],
        returns: Unit,
        injected: true,
    },
    &["__gc_root_handle"] => {
        symbol: "gc_root_handle",
        params: [Ptr],
        returns: U64,
        injected: true,
    },
    &["__gc_unroot_handle"] => {
        symbol: "gc_unroot_handle",
        params: [U64],
        returns: Unit,
        injected: true,
    },
    &["__gc_register_root"] => {
        symbol: "gc_register_root",
        params: [Ptr],
        returns: Unit,
        injected: true,
    },
    &["__gc_unregister_root"] => {
        symbol: "gc_unregister_root",
        params: [Ptr],
        returns: Unit,
        injected: true,
    },
    &["__interop_dispatch_unit"] => {
        symbol: "interop_dispatch_unit",
        params: [Ptr],
        returns: Unit,
        injected: true,
    },
    &["__interop_dispatch_ptr"] => {
        symbol: "interop_dispatch_ptr",
        params: [Ptr],
        returns: Ptr,
        injected: true,
    },
    &["__interop_dispatch_usize"] => {
        symbol: "interop_dispatch_usize",
        params: [Ptr],
        returns: Usize,
        injected: true,
    },
}
