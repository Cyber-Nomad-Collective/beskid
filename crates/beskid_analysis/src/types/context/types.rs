use crate::hir::{HirPath, HirType};
use crate::resolve::ResolvedType;
use crate::syntax::Spanned;
use crate::types::{TypeId, TypeInfo};

use super::context::{TypeContext, TypeError};

impl<'a> TypeContext<'a> {
    pub(super) fn type_id_for_type(&mut self, ty: &Spanned<HirType>) -> Option<TypeId> {
        match &ty.node {
            HirType::Primitive(primitive) => {
                let mapped = self.map_primitive(primitive.node);
                self.primitive_type_id(mapped)
            }
            HirType::Complex(path) => self.type_id_for_path_with_args(path),
            HirType::Array(inner) | HirType::Ref(inner) => self.type_id_for_type(inner),
            HirType::Function {
                return_type,
                parameters,
            } => {
                let return_type = self.type_id_for_type(return_type)?;
                let mut params = Vec::with_capacity(parameters.len());
                for parameter in parameters {
                    params.push(self.type_id_for_type(parameter)?);
                }
                Some(
                    self.type_table
                        .intern(TypeInfo::Function { params, return_type }),
                )
            }
        }
    }

    pub(super) fn type_id_for_path_with_args(&mut self, path: &Spanned<HirPath>) -> Option<TypeId> {
        if let Some(last_segment) = path.node.segments.last()
            && !last_segment.node.type_args.is_empty()
        {
            let resolved = self.resolution.tables.resolved_types.get(&path.span);
            let base = match resolved {
                Some(ResolvedType::Item(item_id)) => *item_id,
                _ => {
                    self.errors.push(TypeError::UnknownType { span: path.span });
                    return None;
                }
            };
            if let Some(expected) = self.generic_items.get(&base)
                && expected.len() != last_segment.node.type_args.len()
            {
                self.errors.push(TypeError::GenericArgumentMismatch {
                    span: path.span,
                    expected: expected.len(),
                    actual: last_segment.node.type_args.len(),
                });
                return None;
            }
            let mut args = Vec::with_capacity(last_segment.node.type_args.len());
            for arg in &last_segment.node.type_args {
                let type_id = self.type_id_for_type(arg)?;
                args.push(type_id);
            }
            return Some(self.type_table.intern(TypeInfo::Applied { base, args }));
        }
        self.type_id_for_type_path(path.span)
    }

    pub(super) fn type_id_for_type_path(
        &mut self,
        span: crate::syntax::SpanInfo,
    ) -> Option<TypeId> {
        match self.resolution.tables.resolved_types.get(&span) {
            Some(ResolvedType::Item(item)) => {
                if let Some(expected) = self.generic_items.get(item)
                    && !expected.is_empty()
                {
                    self.errors.push(TypeError::MissingTypeArguments { span });
                    return None;
                }
                self.named_types.get(item).copied()
            }
            Some(ResolvedType::Generic(name)) => self.generic_params.get(name).copied(),
            None => {
                self.errors.push(TypeError::UnknownType { span });
                None
            }
        }
    }
}
