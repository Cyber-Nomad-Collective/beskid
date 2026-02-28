use crate::analysis::Severity;
use crate::syntax::SpanInfo;

#[derive(Debug, Clone)]
pub enum SemanticIssueKind {
    DuplicateDefinitionName {
        name: String,
        previous: SpanInfo,
    },
    DuplicateEnumVariant {
        name: String,
        previous: SpanInfo,
    },
    DuplicateContractMethod {
        name: String,
        previous: SpanInfo,
    },
    DuplicateItemName {
        name: String,
        previous: SpanInfo,
    },
    UnknownTypeInDefinition {
        type_name: String,
    },
    ConflictingEmbeddedContractMethod {
        contract_name: String,
        method_name: String,
    },

    AmbiguousImport {
        name: String,
        previous: SpanInfo,
    },
    UnknownImportPath {
        path: String,
    },
    UseBeforeDeclaration {
        name: String,
    },
    InvalidHirSpan {
        context: String,
    },
    UnresolvedHirValuePath,
    UnresolvedHirTypePath,
    NonNormalizedHirControlFlow {
        message: String,
    },

    VisibilityModuleNotFound {
        module_path: String,
        file_candidate: String,
        mod_candidate: String,
    },
    VisibilityViolationImportPrivate {
        name: String,
        private_span: SpanInfo,
    },
    UnusedImport {
        path: String,
    },
    UnusedPrivateItem {
        name: String,
    },

    ContractMethodNotFound {
        method_name: String,
        receiver_name: String,
    },
    ContractImplementationSignatureMismatch {
        method_name: String,
        expected: String,
        actual: String,
    },
    ContractMethodMissingImplementation {
        contract_name: String,
        method_name: String,
        expected: String,
    },

    ImmutableAssignment {
        name: String,
    },

    MatchGuardMustBeBoolean,
    MatchArmTypeMismatch {
        expected: String,
        actual: String,
    },
    MatchNonExhaustive {
        enum_name: String,
    },
    DuplicatePatternBinding {
        name: String,
    },
    UnknownEnumPath {
        enum_name: String,
        variant_name: String,
    },
    PatternArityMismatch {
        expected: usize,
        actual: usize,
    },
    EnumConstructorArityMismatch {
        expected: usize,
        actual: usize,
    },
    UnqualifiedEnumConstructor {
        variant_name: String,
        enum_name: String,
    },
    BreakOutsideLoop,
    ContinueOutsideLoop,
    UnreachableCode,

    ResolveDuplicateItem {
        name: String,
        previous: SpanInfo,
    },
    ResolveDuplicateLocal {
        name: String,
        previous: SpanInfo,
    },
    ResolveUnknownValue {
        name: String,
    },
    ResolveUnknownType {
        name: String,
    },
    ResolveUnknownModulePath {
        path: String,
    },
    ResolveUnknownValueInModule {
        module_path: String,
        name: String,
    },
    ResolveUnknownTypeInModule {
        module_path: String,
        name: String,
    },
    ResolvePrivateItemInModule {
        module_path: String,
        name: String,
    },
    ResolveShadowedLocal {
        name: String,
        previous: SpanInfo,
    },

    TypeUnknownType,
    TypeUnknownValueType,
    TypeUnknownStructType,
    TypeInvalidMemberTarget,
    TypeUnknownEnumType,
    TypeUnknownStructField {
        name: String,
    },
    TypeUnknownEnumVariant {
        name: String,
    },
    TypeMissingStructField {
        name: String,
    },
    TypeMissingTypeAnnotation {
        name: String,
    },
    TypeMissingTypeArguments,
    TypeGenericArgumentMismatch {
        expected: usize,
        actual: usize,
    },
    TypeMismatch {
        expected_name: String,
        actual_name: String,
    },
    TypeMatchArmMismatch {
        expected_name: String,
        actual_name: String,
    },
    TypeCallArityMismatch {
        expected: usize,
        actual: usize,
    },
    TypeCallArgumentMismatch {
        expected_name: String,
        actual_name: String,
    },
    TypeEnumConstructorMismatch {
        expected: usize,
        actual: usize,
    },
    TypeUnknownCallTarget,
    TypeInvalidBinaryOp,
    TypeInvalidUnaryOp,
    TypeNonBoolCondition,
    TypeUnsupportedExpression,
    TypeReturnMismatch {
        expected_name: String,
        actual_name: String,
    },
    TypeImplicitNumericCast {
        from: String,
        to: String,
    },
}

impl SemanticIssueKind {
    pub fn code(&self) -> &'static str {
        match self {
            Self::DuplicateDefinitionName { .. } => "E1001",
            Self::DuplicateEnumVariant { .. } => "E1002",
            Self::DuplicateContractMethod { .. } => "E1003",
            Self::ConflictingEmbeddedContractMethod { .. } => "E1004",
            Self::UnknownTypeInDefinition { .. } => "E1005",
            Self::DuplicateItemName { .. } => "E1006",

            Self::AmbiguousImport { .. } => "E1104",
            Self::UnknownImportPath { .. } => "E1105",
            Self::UseBeforeDeclaration { .. } => "E1106",
            Self::InvalidHirSpan { .. } => "E1151",
            Self::UnresolvedHirValuePath => "E1152",
            Self::UnresolvedHirTypePath => "E1153",
            Self::NonNormalizedHirControlFlow { .. } => "E1154",

            Self::VisibilityViolationImportPrivate { .. } => "E1501",
            Self::VisibilityModuleNotFound { .. } => "E1502",
            Self::UnusedImport { .. } => "W1503",
            Self::UnusedPrivateItem { .. } => "W1504",

            Self::ContractMethodMissingImplementation { .. } => "E1601",
            Self::ContractImplementationSignatureMismatch { .. } => "E1602",
            Self::ContractMethodNotFound { .. } => "E1606",

            Self::ImmutableAssignment { .. } => "E1214",

            Self::MatchGuardMustBeBoolean => "E1308",
            Self::MatchArmTypeMismatch { .. } => "E1305",
            Self::MatchNonExhaustive { .. } => "E1304",
            Self::DuplicatePatternBinding { .. } => "E1306",
            Self::UnknownEnumPath { .. } => "E1301",
            Self::PatternArityMismatch { .. } => "E1307",
            Self::EnumConstructorArityMismatch { .. } => "E1302",
            Self::UnqualifiedEnumConstructor { .. } => "E1303",
            Self::BreakOutsideLoop => "E1401",
            Self::ContinueOutsideLoop => "E1402",
            Self::UnreachableCode => "W1403",

            Self::ResolveDuplicateItem { .. } => "E1102",
            Self::ResolveDuplicateLocal { .. } => "E1102",
            Self::ResolveUnknownValue { .. } => "E1101",
            Self::ResolveUnknownType { .. } => "E1201",
            Self::ResolveUnknownModulePath { .. } => "E1105",
            Self::ResolveUnknownValueInModule { .. } => "E1101",
            Self::ResolveUnknownTypeInModule { .. } => "E1201",
            Self::ResolvePrivateItemInModule { .. } => "E1107",
            Self::ResolveShadowedLocal { .. } => "W1103",

            Self::TypeUnknownType => "E1201",
            Self::TypeUnknownValueType => "E1201",
            Self::TypeUnknownStructType => "E1201",
            Self::TypeInvalidMemberTarget => "E1213",
            Self::TypeUnknownEnumType => "E1201",
            Self::TypeUnknownStructField { .. } => "E1211",
            Self::TypeUnknownEnumVariant { .. } => "E1301",
            Self::TypeMissingStructField { .. } => "E1212",
            Self::TypeMissingTypeAnnotation { .. } => "E1202",
            Self::TypeMissingTypeArguments => "E1203",
            Self::TypeGenericArgumentMismatch { .. } => "E1204",
            Self::TypeMismatch { .. } => "E1206",
            Self::TypeMatchArmMismatch { .. } => "E1305",
            Self::TypeCallArityMismatch { .. } => "E1204",
            Self::TypeCallArgumentMismatch { .. } => "E1205",
            Self::TypeEnumConstructorMismatch { .. } => "E1302",
            Self::TypeUnknownCallTarget => "E1606",
            Self::TypeInvalidBinaryOp => "E1209",
            Self::TypeInvalidUnaryOp => "E1210",
            Self::TypeNonBoolCondition => "E1208",
            Self::TypeUnsupportedExpression => "E1202",
            Self::TypeReturnMismatch { .. } => "E1207",
            Self::TypeImplicitNumericCast { .. } => "W1203",
        }
    }

    pub fn severity(&self) -> Severity {
        match self {
            Self::UnusedImport { .. }
            | Self::UnusedPrivateItem { .. }
            | Self::UnreachableCode
            | Self::ResolveShadowedLocal { .. }
            | Self::TypeImplicitNumericCast { .. } => Severity::Warning,
            _ => Severity::Error,
        }
    }

    pub fn label(&self) -> String {
        match self {
            Self::DuplicateDefinitionName { .. } => "duplicate definition name".to_string(),
            Self::DuplicateEnumVariant { .. } => "duplicate enum variant".to_string(),
            Self::DuplicateContractMethod { .. } => "duplicate contract method".to_string(),
            Self::DuplicateItemName { .. } => "duplicate item name".to_string(),
            Self::UnknownTypeInDefinition { .. } => "unknown type in definition".to_string(),
            Self::ConflictingEmbeddedContractMethod { .. } => {
                "conflicting embedded contract method".to_string()
            }
            Self::AmbiguousImport { .. } => "ambiguous import".to_string(),
            Self::UnknownImportPath { .. } => "unknown import path".to_string(),
            Self::UseBeforeDeclaration { .. } => "use before declaration".to_string(),
            Self::InvalidHirSpan { .. } => "invalid HIR span".to_string(),
            Self::UnresolvedHirValuePath => "unresolved HIR value path".to_string(),
            Self::UnresolvedHirTypePath => "unresolved HIR type path".to_string(),
            Self::NonNormalizedHirControlFlow { .. } => {
                "non-normalized HIR control-flow".to_string()
            }
            Self::VisibilityModuleNotFound { .. } => "module not found".to_string(),
            Self::VisibilityViolationImportPrivate { .. } => "visibility violation".to_string(),
            Self::UnusedImport { .. } => "unused import".to_string(),
            Self::UnusedPrivateItem { .. } => "unused private item".to_string(),
            Self::ContractMethodNotFound { .. } => "method not found".to_string(),
            Self::ContractImplementationSignatureMismatch { .. } => {
                "contract implementation signature mismatch".to_string()
            }
            Self::ContractMethodMissingImplementation { .. } => {
                "contract method missing implementation".to_string()
            }
            Self::ImmutableAssignment { .. } => "immutable assignment".to_string(),
            Self::MatchGuardMustBeBoolean => "guard type mismatch".to_string(),
            Self::MatchArmTypeMismatch { .. } => "match arm type mismatch".to_string(),
            Self::MatchNonExhaustive { .. } => "match non-exhaustive".to_string(),
            Self::DuplicatePatternBinding { .. } => "duplicate pattern binding".to_string(),
            Self::UnknownEnumPath { .. } => "unknown enum path".to_string(),
            Self::PatternArityMismatch { .. } => "pattern arity mismatch".to_string(),
            Self::EnumConstructorArityMismatch { .. } => {
                "enum constructor arity mismatch".to_string()
            }
            Self::UnqualifiedEnumConstructor { .. } => "unqualified enum constructor".to_string(),
            Self::BreakOutsideLoop => "break outside loop".to_string(),
            Self::ContinueOutsideLoop => "continue outside loop".to_string(),
            Self::UnreachableCode => "unreachable statement".to_string(),
            Self::ResolveDuplicateItem { .. } => "duplicate item".to_string(),
            Self::ResolveDuplicateLocal { .. } => "duplicate local".to_string(),
            Self::ResolveUnknownValue { .. } => "unknown value".to_string(),
            Self::ResolveUnknownType { .. } => "unknown type".to_string(),
            Self::ResolveUnknownModulePath { .. } => "unknown module path".to_string(),
            Self::ResolveUnknownValueInModule { .. } => "unknown value in module".to_string(),
            Self::ResolveUnknownTypeInModule { .. } => "unknown type in module".to_string(),
            Self::ResolvePrivateItemInModule { .. } => "private item access".to_string(),
            Self::ResolveShadowedLocal { .. } => "shadowed local".to_string(),
            Self::TypeUnknownType => "unknown type".to_string(),
            Self::TypeUnknownValueType => "unknown value type".to_string(),
            Self::TypeUnknownStructType => "unknown struct type".to_string(),
            Self::TypeInvalidMemberTarget => "invalid member access target".to_string(),
            Self::TypeUnknownEnumType => "unknown enum type".to_string(),
            Self::TypeUnknownStructField { .. } => "unknown struct field".to_string(),
            Self::TypeUnknownEnumVariant { .. } => "unknown enum variant".to_string(),
            Self::TypeMissingStructField { .. } => "missing struct field".to_string(),
            Self::TypeMissingTypeAnnotation { .. } => "missing type annotation".to_string(),
            Self::TypeMissingTypeArguments => "missing type arguments".to_string(),
            Self::TypeGenericArgumentMismatch { .. } => "generic argument mismatch".to_string(),
            Self::TypeMismatch { .. } => "type mismatch".to_string(),
            Self::TypeMatchArmMismatch { .. } => "match arm type mismatch".to_string(),
            Self::TypeCallArityMismatch { .. } => "call arity mismatch".to_string(),
            Self::TypeCallArgumentMismatch { .. } => "call argument mismatch".to_string(),
            Self::TypeEnumConstructorMismatch { .. } => {
                "enum constructor arity mismatch".to_string()
            }
            Self::TypeUnknownCallTarget => "unknown call target".to_string(),
            Self::TypeInvalidBinaryOp => "invalid binary operation".to_string(),
            Self::TypeInvalidUnaryOp => "invalid unary operation".to_string(),
            Self::TypeNonBoolCondition => "condition must be boolean".to_string(),
            Self::TypeUnsupportedExpression => "unsupported expression".to_string(),
            Self::TypeReturnMismatch { .. } => "return type mismatch".to_string(),
            Self::TypeImplicitNumericCast { .. } => "implicit numeric cast".to_string(),
        }
    }

    pub fn message(&self) -> String {
        match self {
            Self::DuplicateDefinitionName { name, .. } => {
                format!("duplicate definition name `{name}`")
            }
            Self::DuplicateEnumVariant { name, .. } => format!("duplicate enum variant `{name}`"),
            Self::DuplicateContractMethod { name, .. } => {
                format!("duplicate contract method `{name}`")
            }
            Self::DuplicateItemName { name, .. } => format!("duplicate item name `{name}`"),
            Self::UnknownTypeInDefinition { type_name } => {
                format!("unknown type `{type_name}` in definition")
            }
            Self::ConflictingEmbeddedContractMethod {
                contract_name,
                method_name,
            } => format!(
                "embedded contract `{contract_name}` introduces conflicting method `{method_name}`"
            ),
            Self::AmbiguousImport { name, .. } => format!("ambiguous import for `{name}`"),
            Self::UnknownImportPath { path } => format!("unknown import path `{path}`"),
            Self::UseBeforeDeclaration { name } => {
                format!("use of `{name}` before declaration")
            }
            Self::InvalidHirSpan { context } => {
                format!("invalid span invariant in `{context}`")
            }
            Self::UnresolvedHirValuePath => {
                "unresolved value path in HIR legality validation".to_string()
            }
            Self::UnresolvedHirTypePath => {
                "unresolved type path in HIR legality validation".to_string()
            }
            Self::NonNormalizedHirControlFlow { message } => {
                format!("non-normalized control-flow in HIR: {message}")
            }
            Self::VisibilityModuleNotFound { module_path, .. } => {
                format!("module `{module_path}` not found")
            }
            Self::VisibilityViolationImportPrivate { name, .. } => {
                format!("visibility violation while importing private item `{name}`")
            }
            Self::UnusedImport { path } => format!("unused import `{path}`"),
            Self::UnusedPrivateItem { name } => format!("unused private item `{name}`"),
            Self::ContractMethodNotFound {
                method_name,
                receiver_name,
            } => {
                format!("method `{method_name}` not found in contract `{receiver_name}`")
            }
            Self::ContractImplementationSignatureMismatch { method_name, .. } => {
                format!("contract implementation signature mismatch for `{method_name}`")
            }
            Self::ContractMethodMissingImplementation {
                contract_name,
                method_name,
                ..
            } => {
                format!("contract method `{contract_name}.{method_name}` is missing implementation")
            }
            Self::ImmutableAssignment { name } => {
                format!("cannot assign to immutable binding `{name}`")
            }
            Self::MatchGuardMustBeBoolean => "match guard must be boolean".to_string(),
            Self::MatchArmTypeMismatch { .. } => "match arm type mismatch".to_string(),
            Self::MatchNonExhaustive { enum_name } => {
                format!("non-exhaustive match on enum `{enum_name}`")
            }
            Self::DuplicatePatternBinding { name } => {
                format!("duplicate pattern binding `{name}`")
            }
            Self::UnknownEnumPath {
                enum_name,
                variant_name,
            } => format!("unknown enum path `{enum_name}::{variant_name}`"),
            Self::PatternArityMismatch { expected, actual } => {
                format!("pattern arity mismatch: expected {expected}, got {actual}")
            }
            Self::EnumConstructorArityMismatch { expected, actual } => {
                format!("enum constructor arity mismatch: expected {expected}, got {actual}")
            }
            Self::UnqualifiedEnumConstructor {
                variant_name,
                enum_name,
            } => format!(
                "unqualified enum constructor `{variant_name}`; use `{enum_name}::{variant_name}`"
            ),
            Self::BreakOutsideLoop => "break used outside loop".to_string(),
            Self::ContinueOutsideLoop => "continue used outside loop".to_string(),
            Self::UnreachableCode => "unreachable code".to_string(),
            Self::ResolveDuplicateItem { name, .. } => format!("duplicate item `{name}`"),
            Self::ResolveDuplicateLocal { name, .. } => format!("duplicate local `{name}`"),
            Self::ResolveUnknownValue { name } => format!("unknown value `{name}`"),
            Self::ResolveUnknownType { name } => format!("unknown type `{name}`"),
            Self::ResolveUnknownModulePath { path } => {
                format!("unknown module path `{path}`")
            }
            Self::ResolveUnknownValueInModule { module_path, name } => {
                format!("unknown value `{name}` in module `{module_path}`")
            }
            Self::ResolveUnknownTypeInModule { module_path, name } => {
                format!("unknown type `{name}` in module `{module_path}`")
            }
            Self::ResolvePrivateItemInModule { module_path, name } => {
                format!("private item `{name}` cannot be accessed from module `{module_path}`")
            }
            Self::ResolveShadowedLocal { name, .. } => format!("shadowed local `{name}`"),
            Self::TypeUnknownType => "unknown type".to_string(),
            Self::TypeUnknownValueType => "unknown value type".to_string(),
            Self::TypeUnknownStructType => "unknown struct type".to_string(),
            Self::TypeInvalidMemberTarget => {
                "member access target is not a struct-like type".to_string()
            }
            Self::TypeUnknownEnumType => "unknown enum type".to_string(),
            Self::TypeUnknownStructField { name } => {
                format!("unknown struct field `{name}`")
            }
            Self::TypeUnknownEnumVariant { name } => {
                format!("unknown enum variant `{name}`")
            }
            Self::TypeMissingStructField { name } => {
                format!("missing struct field `{name}`")
            }
            Self::TypeMissingTypeAnnotation { name } => {
                format!("missing type annotation for `{name}`")
            }
            Self::TypeMissingTypeArguments => "missing type arguments for generic type".to_string(),
            Self::TypeGenericArgumentMismatch { expected, actual } => {
                format!("generic argument mismatch: expected {expected}, got {actual}")
            }
            Self::TypeMismatch {
                expected_name,
                actual_name,
            } => format!("type mismatch: expected {expected_name}, got {actual_name}"),
            Self::TypeMatchArmMismatch {
                expected_name,
                actual_name,
            } => format!("match arm type mismatch: expected {expected_name}, got {actual_name}"),
            Self::TypeCallArityMismatch { expected, actual } => {
                format!("call arity mismatch: expected {expected}, got {actual}")
            }
            Self::TypeCallArgumentMismatch {
                expected_name,
                actual_name,
            } => format!("call argument mismatch: expected {expected_name}, got {actual_name}"),
            Self::TypeEnumConstructorMismatch { expected, actual } => {
                format!("enum constructor arity mismatch: expected {expected}, got {actual}")
            }
            Self::TypeUnknownCallTarget => "unknown call target".to_string(),
            Self::TypeInvalidBinaryOp => "invalid binary operation".to_string(),
            Self::TypeInvalidUnaryOp => "invalid unary operation".to_string(),
            Self::TypeNonBoolCondition => "non-boolean condition".to_string(),
            Self::TypeUnsupportedExpression => "unsupported expression".to_string(),
            Self::TypeReturnMismatch {
                expected_name,
                actual_name,
            } => format!("return type mismatch: expected {expected_name}, got {actual_name}"),
            Self::TypeImplicitNumericCast { from, to } => {
                format!("implicit numeric cast from {from} to {to}")
            }
        }
    }

    pub fn help(&self) -> Option<String> {
        match self {
            Self::DuplicateDefinitionName { previous, .. }
            | Self::DuplicateEnumVariant { previous, .. }
            | Self::DuplicateContractMethod { previous, .. }
            | Self::DuplicateItemName { previous, .. }
            | Self::ResolveDuplicateItem { previous, .. }
            | Self::ResolveDuplicateLocal { previous, .. }
            | Self::ResolveShadowedLocal { previous, .. }
            | Self::AmbiguousImport { previous, .. } => Some(format!(
                "previously defined at line {}, column {}",
                previous.line_col_start.0, previous.line_col_start.1
            )),
            Self::VisibilityModuleNotFound {
                file_candidate,
                mod_candidate,
                ..
            } => Some(format!("expected `{file_candidate}` or `{mod_candidate}`")),
            Self::VisibilityViolationImportPrivate { private_span, .. } => Some(format!(
                "item is private (declared at line {}, column {})",
                private_span.line_col_start.0, private_span.line_col_start.1
            )),
            Self::ContractImplementationSignatureMismatch {
                expected, actual, ..
            } => Some(format!("expected `{expected}`, got `{actual}`")),
            Self::ContractMethodMissingImplementation { expected, .. } => {
                Some(format!("expected signature `{expected}`"))
            }
            Self::ImmutableAssignment { .. } => {
                Some("declare it as `let mut` to allow assignment".to_string())
            }
            Self::MatchArmTypeMismatch { expected, actual } => {
                Some(format!("expected `{expected}`, got `{actual}`"))
            }
            Self::ResolvePrivateItemInModule { .. } => {
                Some("mark the item `pub` or avoid cross-module access".to_string())
            }
            Self::TypeMissingTypeArguments => {
                Some("provide explicit type arguments, e.g. `Type<i32>`".to_string())
            }
            Self::TypeImplicitNumericCast { .. } => {
                Some("add an explicit cast to make conversion intent clear".to_string())
            }
            Self::UnreachableCode => Some(
                "remove this statement or move it before the terminating statement".to_string(),
            ),
            _ => None,
        }
    }
}
