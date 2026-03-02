use crate::symbols::{
    SYM_ALLOC, SYM_ARRAY_NEW, SYM_GC_REGISTER_ROOT, SYM_GC_ROOT_HANDLE, SYM_GC_UNREGISTER_ROOT,
    SYM_GC_UNROOT_HANDLE, SYM_GC_WRITE_BARRIER, SYM_INTEROP_DISPATCH_PTR,
    SYM_INTEROP_DISPATCH_UNIT, SYM_INTEROP_DISPATCH_USIZE, SYM_PANIC, SYM_PANIC_STR,
    SYM_STR_CONCAT, SYM_STR_LEN, SYM_STR_NEW, SYM_SYS_PRINT, SYM_SYS_PRINTLN,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AbiParamKind {
    Ptr,
    I64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AbiReturnKind {
    Void,
    Ptr,
    I64,
    I32,
    Never,
}

#[derive(Debug, Clone, Copy)]
pub struct BuiltinFnSpec {
    pub symbol: &'static str,
    pub params: &'static [AbiParamKind],
    pub returns: AbiReturnKind,
}

const PTR_PTR: [AbiParamKind; 2] = [AbiParamKind::Ptr, AbiParamKind::Ptr];
const PTR_ONLY: [AbiParamKind; 1] = [AbiParamKind::Ptr];
const I64_ONLY: [AbiParamKind; 1] = [AbiParamKind::I64];

pub const BUILTIN_SPECS: &[BuiltinFnSpec] = &[
    BuiltinFnSpec {
        symbol: SYM_ALLOC,
        params: &PTR_PTR,
        returns: AbiReturnKind::Ptr,
    },
    BuiltinFnSpec {
        symbol: SYM_STR_NEW,
        params: &PTR_PTR,
        returns: AbiReturnKind::Ptr,
    },
    BuiltinFnSpec {
        symbol: SYM_STR_CONCAT,
        params: &PTR_PTR,
        returns: AbiReturnKind::Ptr,
    },
    BuiltinFnSpec {
        symbol: SYM_ARRAY_NEW,
        params: &PTR_PTR,
        returns: AbiReturnKind::Ptr,
    },
    BuiltinFnSpec {
        symbol: SYM_PANIC,
        params: &PTR_PTR,
        returns: AbiReturnKind::Never,
    },
    BuiltinFnSpec {
        symbol: SYM_PANIC_STR,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Never,
    },
    BuiltinFnSpec {
        symbol: SYM_SYS_PRINT,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_SYS_PRINTLN,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_STR_LEN,
        params: &PTR_ONLY,
        returns: AbiReturnKind::I64,
    },
    BuiltinFnSpec {
        symbol: SYM_GC_WRITE_BARRIER,
        params: &PTR_PTR,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_GC_ROOT_HANDLE,
        params: &PTR_ONLY,
        returns: AbiReturnKind::I64,
    },
    BuiltinFnSpec {
        symbol: SYM_GC_UNROOT_HANDLE,
        params: &I64_ONLY,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_GC_REGISTER_ROOT,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_GC_UNREGISTER_ROOT,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_INTEROP_DISPATCH_UNIT,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Void,
    },
    BuiltinFnSpec {
        symbol: SYM_INTEROP_DISPATCH_PTR,
        params: &PTR_ONLY,
        returns: AbiReturnKind::Ptr,
    },
    BuiltinFnSpec {
        symbol: SYM_INTEROP_DISPATCH_USIZE,
        params: &PTR_ONLY,
        returns: AbiReturnKind::I64,
    },
];
