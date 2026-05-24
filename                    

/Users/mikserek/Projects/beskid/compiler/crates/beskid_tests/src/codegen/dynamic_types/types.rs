use crate::codegen::util::lower_resolve_type;
use beskid_codegen::lowering::expressions::serialize::DYNAMIC_TYPE_NAME;
use beskid_codegen::lowering::types::{
    dynamic_clif_type, is_dynamic_type_id, map_type_id_to_clif_with_dynamic, pointer_type,
};

#[test]
fn dynamic_named_alias_maps_to_cell_pointer_clif() {
    let source = format!("type {DYNAMIC_TYPE_NAME} = i64; i64 main() {{ return 0; }}");
    let (_, resolution, typed) = lower_resolve_type(&source);

    let dynamic_item = resolution
        .items
        .iter()
        .find(|item| item.name == DYNAMIC_TYPE_NAME)
        .expect("expected dynamic type alias");
    let dynamic_type_id = typed
        .types
        .iter()
        .find_map(|(id, info)| {
            if let beskid_analysis::types::TypeInfo::Named(item_id) = info
                && *item_id == dynamic_item.id
            {
                Some(*id)
            } else {
                None
            }
        })
        .expect("expected named type id for dynamic alias");

    assert!(is_dynamic_type_id(
        &resolution,
        &typed,
        dynamic_type_id
    ));
    assert_eq!(dynamic_clif_type(), pointer_type());
    assert_eq!(
        map_type_id_to_clif_with_dynamic(&resolution, &typed, dynamic_type_id),
        Some(pointer_type())
    );
}
