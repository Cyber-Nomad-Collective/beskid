use cranelift_codegen::ir::types;
use pecan_analysis::hir::{HirPrimitiveType, HirType};
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};

pub(crate) fn map_hir_type_to_type_id(type_result: &TypeResult, ty: &HirType) -> Option<TypeId> {
    match ty {
        HirType::Primitive(primitive) => find_primitive_type_id(type_result, primitive.node),
        _ => None,
    }
}

pub(crate) fn map_hir_type_to_clif(ty: &HirType) -> Option<cranelift_codegen::ir::Type> {
    match ty {
        HirType::Primitive(primitive) => map_primitive_to_clif(primitive.node),
        _ => None,
    }
}

pub(crate) fn map_type_id_to_clif(
    type_result: &TypeResult,
    type_id: TypeId,
) -> Option<cranelift_codegen::ir::Type> {
    match type_result.types.get(type_id) {
        Some(TypeInfo::Primitive(primitive)) => map_primitive_to_clif(*primitive),
        _ => None,
    }
}

fn find_primitive_type_id(type_result: &TypeResult, primitive: HirPrimitiveType) -> Option<TypeId> {
    let mut index = 0usize;
    loop {
        let type_id = TypeId(index);
        let Some(info) = type_result.types.get(type_id) else {
            return None;
        };
        if matches!(info, TypeInfo::Primitive(found) if *found == primitive) {
            return Some(type_id);
        }
        index += 1;
    }
}

fn map_primitive_to_clif(primitive: HirPrimitiveType) -> Option<cranelift_codegen::ir::Type> {
    match primitive {
        HirPrimitiveType::Bool => Some(types::I8),
        HirPrimitiveType::I32 => Some(types::I32),
        HirPrimitiveType::I64 => Some(types::I64),
        HirPrimitiveType::U8 => Some(types::I8),
        HirPrimitiveType::F64 => Some(types::F64),
        HirPrimitiveType::Unit => None,
        HirPrimitiveType::Char | HirPrimitiveType::String => None,
    }
}
