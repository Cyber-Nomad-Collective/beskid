use crate::hir::HirType;
use crate::syntax::Spanned;
use crate::types::TypeId;

use super::context::{TypeContext, TypeError};

impl<'a> TypeContext<'a> {
    pub(super) fn type_id_for_type(&mut self, ty: &Spanned<HirType>) -> Option<TypeId> {
        match &ty.node {
            HirType::Primitive(primitive) => {
                let mapped = self.map_primitive(primitive.node);
                self.primitive_type_id(mapped)
            }
            HirType::Complex(path) => self.type_id_for_type_path(path.span),
            HirType::Array(inner) | HirType::Ref(inner) => self.type_id_for_type(inner),
        }
    }

    pub(super) fn type_id_for_type_path(
        &mut self,
        span: crate::syntax::SpanInfo,
    ) -> Option<TypeId> {
        match self.resolution.tables.resolved_types.get(&span) {
            Some(item) => self.named_types.get(item).copied(),
            None => {
                self.errors.push(TypeError::UnknownType { span });
                None
            }
        }
    }
}
