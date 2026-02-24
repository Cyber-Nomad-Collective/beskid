pub mod context;
pub mod table;

pub use context::context::{type_program, type_program_with_errors, TypeContext, TypeError, TypeResult};
pub use table::{TypeId, TypeInfo, TypeTable};
