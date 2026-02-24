use std::collections::HashMap;

use cranelift_codegen::ir::Endianness;
use cranelift_module::{DataDescription, DataId, Linkage, Module, ModuleResult};
use pecan_analysis::types::TypeId;

use crate::lowering::CodegenArtifact;
use crate::lowering::descriptor::TypeDescriptorData;

#[derive(Debug, Clone)]
pub struct DescriptorHandles {
    pub descriptor: DataId,
    pub offsets: DataId,
}

pub fn emit_string_literals<M: Module>(
    module: &mut M,
    artifact: &CodegenArtifact,
) -> ModuleResult<HashMap<String, DataId>> {
    let mut handles = HashMap::new();
    for (symbol, data) in &artifact.string_literals {
        let data_id = module.declare_data(symbol, Linkage::Local, false, false)?;
        let mut ctx = DataDescription::new();
        ctx.define(data.clone().into_boxed_slice());
        module.define_data(data_id, &ctx)?;
        handles.insert(symbol.clone(), data_id);
    }
    Ok(handles)
}

pub fn emit_type_descriptors<M: Module>(
    module: &mut M,
    artifact: &CodegenArtifact,
) -> ModuleResult<HashMap<TypeId, DescriptorHandles>> {
    let mut handles = HashMap::new();
    for (type_id, descriptor) in &artifact.type_descriptors {
        let offsets_id = declare_descriptor_offsets(module, *type_id)?;
        let offsets_ctx = build_offsets_data(module, descriptor);
        module.define_data(offsets_id, &offsets_ctx)?;

        let descriptor_id = declare_descriptor(module, *type_id)?;
        let descriptor_ctx = build_descriptor_data(module, descriptor, offsets_id);
        module.define_data(descriptor_id, &descriptor_ctx)?;

        handles.insert(
            *type_id,
            DescriptorHandles {
                descriptor: descriptor_id,
                offsets: offsets_id,
            },
        );
    }
    Ok(handles)
}

pub(crate) fn descriptor_offsets_symbol_name(type_id: TypeId) -> String {
    format!("__pecan_type_offsets_{}", type_id.0)
}

pub(crate) fn descriptor_symbol_name(type_id: TypeId) -> String {
    format!("__pecan_type_desc_{}", type_id.0)
}

fn declare_descriptor_offsets<M: Module>(module: &mut M, type_id: TypeId) -> ModuleResult<DataId> {
    let name = descriptor_offsets_symbol_name(type_id);
    module.declare_data(&name, Linkage::Local, false, false)
}

fn declare_descriptor<M: Module>(module: &mut M, type_id: TypeId) -> ModuleResult<DataId> {
    let name = descriptor_symbol_name(type_id);
    module.declare_data(&name, Linkage::Local, false, false)
}

fn build_offsets_data<M: Module>(module: &M, descriptor: &TypeDescriptorData) -> DataDescription {
    let mut ctx = DataDescription::new();
    let ptr_size = module.isa().pointer_bytes();
    let little_endian = matches!(module.isa().endianness(), Endianness::Little);

    let mut bytes = Vec::with_capacity(descriptor.pointer_offsets.len() * ptr_size as usize);
    for offset in &descriptor.pointer_offsets {
        write_usize(&mut bytes, *offset, ptr_size, little_endian);
    }
    ctx.define(bytes.into_boxed_slice());
    ctx
}

fn build_descriptor_data<M: Module>(
    module: &mut M,
    descriptor: &TypeDescriptorData,
    offsets_id: DataId,
) -> DataDescription {
    let ptr_size = module.isa().pointer_bytes();
    let little_endian = matches!(module.isa().endianness(), Endianness::Little);
    let usize_align = ptr_size as usize;
    let u32_align = 4usize;

    let mut ctx = DataDescription::new();
    let mut bytes = Vec::new();

    let _size_offset =
        push_usize(&mut bytes, descriptor.size, ptr_size, little_endian, usize_align);
    let _align_offset =
        push_usize(&mut bytes, descriptor.align, ptr_size, little_endian, usize_align);
    let _ptr_count_offset = push_u32(
        &mut bytes,
        descriptor.pointer_offsets.len() as u32,
        little_endian,
        u32_align,
    );

    pad_to_alignment(&mut bytes, usize_align);
    let ptr_offsets_offset = bytes.len();
    bytes.extend(std::iter::repeat(0u8).take(usize_align));

    pad_to_alignment(&mut bytes, usize_align);
    let _name_offset = bytes.len();
    bytes.extend(std::iter::repeat(0u8).take(usize_align));

    ctx.define(bytes.into_boxed_slice());
    let gv = module.declare_data_in_data(offsets_id, &mut ctx);
    ctx.write_data_addr(ptr_offsets_offset as u32, gv, 0);
    ctx
}

fn write_usize(buf: &mut Vec<u8>, value: usize, ptr_size: u8, little_endian: bool) {
    match (ptr_size, little_endian) {
        (4, true) => buf.extend_from_slice(&(value as u32).to_le_bytes()),
        (4, false) => buf.extend_from_slice(&(value as u32).to_be_bytes()),
        (8, true) => buf.extend_from_slice(&(value as u64).to_le_bytes()),
        (8, false) => buf.extend_from_slice(&(value as u64).to_be_bytes()),
        _ => panic!("unsupported pointer size {ptr_size}"),
    }
}

fn push_usize(
    buf: &mut Vec<u8>,
    value: usize,
    ptr_size: u8,
    little_endian: bool,
    align: usize,
) -> usize {
    pad_to_alignment(buf, align);
    let offset = buf.len();
    write_usize(buf, value, ptr_size, little_endian);
    offset
}

fn push_u32(buf: &mut Vec<u8>, value: u32, little_endian: bool, align: usize) -> usize {
    pad_to_alignment(buf, align);
    let offset = buf.len();
    if little_endian {
        buf.extend_from_slice(&value.to_le_bytes());
    } else {
        buf.extend_from_slice(&value.to_be_bytes());
    }
    offset
}

fn pad_to_alignment(buf: &mut Vec<u8>, align: usize) {
    let padding = (align - (buf.len() % align)) % align;
    if padding > 0 {
        buf.extend(std::iter::repeat(0u8).take(padding));
    }
}
