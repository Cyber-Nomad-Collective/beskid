use beskid_analysis::hir::HirPrimitiveType;
use beskid_analysis::types::TypeInfo;

macro_rules! call_entrypoint {
    ($ptr:expr, $ret:ty, $value:ident => $formatter:expr) => {{
        let $value: $ret = {
            // SAFETY: the caller selects `$ret` based on resolved return type.
            unsafe { invoke0::<$ret>($ptr) }
        };
        $formatter
    }};
}

pub(crate) struct JitCallable;

impl JitCallable {
    pub(crate) fn execute_and_format(ptr: *const u8, return_info: &TypeInfo) -> String {
        match return_info {
            TypeInfo::Primitive(HirPrimitiveType::Unit) => {
                // SAFETY: `ptr` is expected to point to a JIT function with signature `extern "C" fn()`.
                call_entrypoint!(ptr, (), _ignored => "ok".to_owned())
            }
            TypeInfo::Primitive(HirPrimitiveType::String)
            | TypeInfo::Named(_)
            | TypeInfo::GenericParam(_)
            | TypeInfo::Applied { .. } => {
                // SAFETY: JIT pointer-like returns are represented as `u64`.
                call_entrypoint!(ptr, u64, value => format!("0x{value:016x}"))
            }
            TypeInfo::Primitive(HirPrimitiveType::I64) => {
                // SAFETY: Signature is selected from typed return info.
                call_entrypoint!(ptr, i64, value => value.to_string())
            }
            TypeInfo::Primitive(HirPrimitiveType::I32) => {
                // SAFETY: Signature is selected from typed return info.
                call_entrypoint!(ptr, i32, value => value.to_string())
            }
            TypeInfo::Primitive(HirPrimitiveType::U8) => {
                // SAFETY: Signature is selected from typed return info.
                call_entrypoint!(ptr, u8, value => value.to_string())
            }
            TypeInfo::Primitive(HirPrimitiveType::Bool) => {
                // SAFETY: `bool` is ABI-lowered as `u8` by the backend.
                call_entrypoint!(ptr, u8, value => (value != 0).to_string())
            }
            TypeInfo::Primitive(HirPrimitiveType::F64) => {
                // SAFETY: Signature is selected from typed return info.
                call_entrypoint!(ptr, f64, value => value.to_string())
            }
            TypeInfo::Primitive(HirPrimitiveType::Char) => {
                // SAFETY: `char` is ABI-lowered as a `u32` scalar value.
                call_entrypoint!(ptr, u32, value => {
                    std::char::from_u32(value).unwrap_or('\u{FFFD}').to_string()
                })
            }
        }
    }
}

unsafe fn invoke0<R>(ptr: *const u8) -> R {
    let callable: extern "C" fn() -> R = unsafe { std::mem::transmute(ptr) };
    callable()
}

#[cfg(test)]
mod tests {
    use super::JitCallable;
    use beskid_analysis::hir::HirPrimitiveType;
    use beskid_analysis::types::TypeInfo;

    extern "C" fn ret_unit() {}
    extern "C" fn ret_i64() -> i64 {
        42
    }
    extern "C" fn ret_bool_u8() -> u8 {
        1
    }
    extern "C" fn ret_char_u32() -> u32 {
        'A' as u32
    }
    extern "C" fn ret_ptr_u64() -> u64 {
        0xABCD
    }

    #[test]
    fn executes_and_formats_unit() {
        let output = JitCallable::execute_and_format(
            (ret_unit as extern "C" fn() as *const ()).cast::<u8>(),
            &TypeInfo::Primitive(HirPrimitiveType::Unit),
        );
        assert_eq!(output, "ok");
    }

    #[test]
    fn executes_and_formats_i64() {
        let output = JitCallable::execute_and_format(
            (ret_i64 as extern "C" fn() -> i64 as *const ()).cast::<u8>(),
            &TypeInfo::Primitive(HirPrimitiveType::I64),
        );
        assert_eq!(output, "42");
    }

    #[test]
    fn executes_and_formats_bool() {
        let output = JitCallable::execute_and_format(
            (ret_bool_u8 as extern "C" fn() -> u8 as *const ()).cast::<u8>(),
            &TypeInfo::Primitive(HirPrimitiveType::Bool),
        );
        assert_eq!(output, "true");
    }

    #[test]
    fn executes_and_formats_char() {
        let output = JitCallable::execute_and_format(
            (ret_char_u32 as extern "C" fn() -> u32 as *const ()).cast::<u8>(),
            &TypeInfo::Primitive(HirPrimitiveType::Char),
        );
        assert_eq!(output, "A");
    }

    #[test]
    fn executes_and_formats_pointer_like_result() {
        let output = JitCallable::execute_and_format(
            (ret_ptr_u64 as extern "C" fn() -> u64 as *const ()).cast::<u8>(),
            &TypeInfo::Primitive(HirPrimitiveType::String),
        );
        assert_eq!(output, "0x000000000000abcd");
    }
}
