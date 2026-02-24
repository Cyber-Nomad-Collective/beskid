use pecan_analysis::resolve::Resolution;
use pecan_analysis::types::{TypeId, TypeInfo, TypeResult};
use pecan_codegen::lowering::lower_program;

use crate::codegen::util::lower_resolve_type;

fn find_named_type_id(typed: &TypeResult, resolution: &Resolution, name: &str) -> TypeId {
    let item_id = resolution
        .items
        .iter()
        .find(|info| info.name == name)
        .expect("expected item in resolution")
        .id;
    let mut index = 0usize;
    loop {
        let type_id = TypeId(index);
        let Some(info) = typed.types.get(type_id) else {
            break;
        };
        if matches!(info, TypeInfo::Named(found) if *found == item_id) {
            return type_id;
        }
        index += 1;
    }
    panic!("expected type id for {name}");
}

fn align_to(value: usize, align: usize) -> usize {
    if align == 0 {
        return value;
    }
    (value + align - 1) & !(align - 1)
}

#[test]
fn descriptor_emits_entries_for_named_types() {
    let source = "type Foo { i64 x } enum Choice { Some(Foo value), None } unit main() { }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let foo_id = find_named_type_id(&typed, &resolution, "Foo");
    let choice_id = find_named_type_id(&typed, &resolution, "Choice");
    assert!(artifact.type_descriptors.contains_key(&foo_id));
    assert!(artifact.type_descriptors.contains_key(&choice_id));
}

#[test]
fn descriptor_struct_pointer_offsets_for_named_fields() {
    let source = "type Foo { i64 x } type Bar { Foo f, i64 y } unit main() { }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let foo_id = find_named_type_id(&typed, &resolution, "Foo");
    let bar_id = find_named_type_id(&typed, &resolution, "Bar");
    let foo_desc = artifact
        .type_descriptors
        .get(&foo_id)
        .expect("expected Foo descriptor");
    let bar_desc = artifact
        .type_descriptors
        .get(&bar_id)
        .expect("expected Bar descriptor");

    let header_size = std::mem::size_of::<usize>();
    let expected_offset = align_to(header_size, foo_desc.align);
    assert_eq!(bar_desc.pointer_offsets, vec![expected_offset]);
    assert!(foo_desc.pointer_offsets.is_empty());
}

#[test]
fn descriptor_enum_pointer_offsets_include_payload_start() {
    let source = "type Foo { i64 x } enum Choice { Some(Foo value), None } unit main() { }";
    let (hir, resolution, typed) = lower_resolve_type(source);
    let artifact = lower_program(&hir, &resolution, &typed)
        .expect("expected codegen lowering to succeed");

    let foo_id = find_named_type_id(&typed, &resolution, "Foo");
    let choice_id = find_named_type_id(&typed, &resolution, "Choice");
    let foo_desc = artifact
        .type_descriptors
        .get(&foo_id)
        .expect("expected Foo descriptor");
    let choice_desc = artifact
        .type_descriptors
        .get(&choice_id)
        .expect("expected Choice descriptor");

    let header_size = std::mem::size_of::<usize>();
    let payload_align = foo_desc.align.max(4);
    let payload_start = align_to(header_size, payload_align);
    let offset_in_payload = align_to(4, foo_desc.align);
    let expected = payload_start + offset_in_payload;
    assert_eq!(choice_desc.pointer_offsets, vec![expected]);
}
