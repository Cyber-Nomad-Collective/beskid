use std::collections::HashMap;

use beskid_analysis::resolve::ItemId;
use beskid_analysis::types::{TypeId, TypeInfo, TypeResult};

const HEADER_SIZE: usize = std::mem::size_of::<usize>();
const HEADER_ALIGN: usize = std::mem::align_of::<usize>();
const ENUM_TAG_SIZE: usize = 4;
const ENUM_TAG_ALIGN: usize = 4;

#[derive(Debug, Clone)]
pub struct TypeLayout {
    pub size: usize,
    pub align: usize,
    pub pointer_offsets: Vec<usize>,
}

#[derive(Debug, Clone)]
pub struct TypeDescriptorData {
    pub size: usize,
    pub align: usize,
    pub pointer_offsets: Vec<usize>,
}

pub(crate) fn get_or_compute_layout(
    cache: &mut HashMap<TypeId, TypeLayout>,
    type_result: &TypeResult,
    type_id: TypeId,
) -> Option<TypeLayout> {
    if let Some(layout) = cache.get(&type_id) {
        return Some(layout.clone());
    }
    let layout = compute_layout(type_result, type_id)?;
    cache.insert(type_id, layout.clone());
    Some(layout)
}

pub(crate) fn build_descriptor(layout: &TypeLayout) -> TypeDescriptorData {
    TypeDescriptorData {
        size: layout.size,
        align: layout.align,
        pointer_offsets: layout.pointer_offsets.clone(),
    }
}

fn compute_layout(type_result: &TypeResult, type_id: TypeId) -> Option<TypeLayout> {
    match type_result.types.get(type_id)? {
        TypeInfo::Primitive(primitive) => Some(primitive_layout(*primitive)),
        TypeInfo::Named(item_id) => compute_named_layout(type_result, *item_id),
        TypeInfo::GenericParam(_) => Some(pointer_layout()),
        TypeInfo::Applied { base, .. } => compute_named_layout(type_result, *base),
        TypeInfo::Function { .. } => Some(pointer_layout()),
    }
}

fn pointer_layout() -> TypeLayout {
    TypeLayout {
        size: std::mem::size_of::<usize>(),
        align: std::mem::align_of::<usize>(),
        pointer_offsets: Vec::new(),
    }
}

fn compute_named_layout(type_result: &TypeResult, item_id: ItemId) -> Option<TypeLayout> {
    if let Some(fields) = type_result.struct_fields_ordered.get(&item_id) {
        return Some(struct_layout(type_result, fields));
    }
    if let Some(variants) = type_result.enum_variants_ordered.get(&item_id) {
        return Some(enum_layout(type_result, variants));
    }
    None
}

fn primitive_layout(primitive: beskid_analysis::hir::HirPrimitiveType) -> TypeLayout {
    let (size, align) = match primitive {
        beskid_analysis::hir::HirPrimitiveType::Bool => (1, 1),
        beskid_analysis::hir::HirPrimitiveType::I32 => (4, 4),
        beskid_analysis::hir::HirPrimitiveType::I64 => (8, 8),
        beskid_analysis::hir::HirPrimitiveType::U8 => (1, 1),
        beskid_analysis::hir::HirPrimitiveType::F64 => (8, 8),
        beskid_analysis::hir::HirPrimitiveType::Unit => (0, 1),
        beskid_analysis::hir::HirPrimitiveType::Char => (4, 4),
        beskid_analysis::hir::HirPrimitiveType::String => (8, 8),
    };
    TypeLayout {
        size,
        align,
        pointer_offsets: Vec::new(),
    }
}

fn struct_layout(type_result: &TypeResult, fields: &[(String, TypeId)]) -> TypeLayout {
    let mut offset = HEADER_SIZE;
    let mut align = HEADER_ALIGN;
    let mut pointer_offsets = Vec::new();

    for (_, field_type) in fields {
        if let Some(field_layout) = compute_layout(type_result, *field_type) {
            offset = align_to(offset, field_layout.align);
            if is_pointer_like_type(type_result, *field_type) {
                pointer_offsets.push(offset);
            }
            offset += field_layout.size;
            align = align.max(field_layout.align);
        }
    }

    TypeLayout {
        size: align_to(offset, align),
        align,
        pointer_offsets,
    }
}

fn enum_layout(type_result: &TypeResult, variants: &[(String, Vec<TypeId>)]) -> TypeLayout {
    let tag_size = ENUM_TAG_SIZE;
    let tag_align = ENUM_TAG_ALIGN;

    let mut payload_size = 0usize;
    let mut payload_align = tag_align;
    let mut pointer_offsets = Vec::new();

    for (_, fields) in variants {
        let mut offset = tag_size;
        let mut align = tag_align;
        for field_type in fields {
            if let Some(field_layout) = compute_layout(type_result, *field_type) {
                offset = align_to(offset, field_layout.align);
                if is_pointer_like_type(type_result, *field_type) {
                    pointer_offsets.push(offset);
                }
                offset += field_layout.size;
                align = align.max(field_layout.align);
            }
        }
        payload_size = payload_size.max(align_to(offset, align));
        payload_align = payload_align.max(align);
    }

    let payload_start = align_to(HEADER_SIZE, payload_align.max(tag_align));
    pointer_offsets
        .iter_mut()
        .for_each(|off| *off += payload_start);

    let total_size = align_to(
        payload_start + payload_size,
        HEADER_ALIGN.max(payload_align),
    );

    TypeLayout {
        size: total_size,
        align: HEADER_ALIGN.max(payload_align),
        pointer_offsets,
    }
}

pub(crate) fn is_pointer_like_type(type_result: &TypeResult, type_id: TypeId) -> bool {
    match type_result.types.get(type_id) {
        Some(TypeInfo::Named(_)) => true,
        Some(TypeInfo::Applied { .. }) => true,
        Some(TypeInfo::GenericParam(_)) => true,
        Some(TypeInfo::Function { .. }) => true,
        Some(TypeInfo::Primitive(_)) => false,
        None => false,
    }
}

fn align_to(value: usize, align: usize) -> usize {
    if align == 0 {
        return value;
    }
    (value + align - 1) & !(align - 1)
}

pub(crate) fn struct_field_offsets(
    type_result: &TypeResult,
    item_id: ItemId,
) -> Option<HashMap<String, usize>> {
    let fields = type_result.struct_fields_ordered.get(&item_id)?;
    let mut offset = HEADER_SIZE;
    let mut offsets = HashMap::new();

    for (name, field_type) in fields {
        let field_layout = compute_layout(type_result, *field_type)?;
        offset = align_to(offset, field_layout.align);
        offsets.insert(name.clone(), offset);
        offset += field_layout.size;
    }
    Some(offsets)
}

pub(crate) fn enum_payload_start(type_result: &TypeResult, item_id: ItemId) -> Option<usize> {
    let variants = type_result.enum_variants_ordered.get(&item_id)?;
    let tag_align = ENUM_TAG_ALIGN;
    let mut payload_align = tag_align;
    for (_, fields) in variants {
        let mut align = tag_align;
        for field_type in fields {
            let field_layout = compute_layout(type_result, *field_type)?;
            align = align.max(field_layout.align);
        }
        payload_align = payload_align.max(align);
    }
    Some(align_to(HEADER_SIZE, payload_align.max(tag_align)))
}

pub(crate) fn enum_variant_field_offsets(
    type_result: &TypeResult,
    item_id: ItemId,
    variant_name: &str,
) -> Option<Vec<usize>> {
    let variants = type_result.enum_variants_ordered.get(&item_id)?;
    let fields = variants
        .iter()
        .find(|(name, _)| name == variant_name)
        .map(|(_, fields)| fields)?;
    let payload_start = enum_payload_start(type_result, item_id)?;
    let mut offset = ENUM_TAG_SIZE;
    let mut align = ENUM_TAG_ALIGN;
    let mut offsets = Vec::with_capacity(fields.len());
    for field_type in fields {
        let field_layout = compute_layout(type_result, *field_type)?;
        offset = align_to(offset, field_layout.align);
        offsets.push(payload_start + offset);
        offset += field_layout.size;
        align = align.max(field_layout.align);
    }
    let _ = align_to(offset, align);
    Some(offsets)
}
