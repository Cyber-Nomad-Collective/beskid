#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AttributeTargetKind {
    TypeDeclaration,
    EnumDeclaration,
    ContractDeclaration,
    ModuleDeclaration,
    FunctionDeclaration,
    MethodDeclaration,
    FieldDeclaration,
    ParameterDeclaration,
}

impl AttributeTargetKind {
    pub const ALL: [Self; 8] = [
        Self::TypeDeclaration,
        Self::EnumDeclaration,
        Self::ContractDeclaration,
        Self::ModuleDeclaration,
        Self::FunctionDeclaration,
        Self::MethodDeclaration,
        Self::FieldDeclaration,
        Self::ParameterDeclaration,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::TypeDeclaration => "TypeDeclaration",
            Self::EnumDeclaration => "EnumDeclaration",
            Self::ContractDeclaration => "ContractDeclaration",
            Self::ModuleDeclaration => "ModuleDeclaration",
            Self::FunctionDeclaration => "FunctionDeclaration",
            Self::MethodDeclaration => "MethodDeclaration",
            Self::FieldDeclaration => "FieldDeclaration",
            Self::ParameterDeclaration => "ParameterDeclaration",
        }
    }

    pub fn parse(name: &str) -> Option<Self> {
        match name {
            "TypeDeclaration" => Some(Self::TypeDeclaration),
            "EnumDeclaration" => Some(Self::EnumDeclaration),
            "ContractDeclaration" => Some(Self::ContractDeclaration),
            "ModuleDeclaration" => Some(Self::ModuleDeclaration),
            "FunctionDeclaration" => Some(Self::FunctionDeclaration),
            "MethodDeclaration" => Some(Self::MethodDeclaration),
            "FieldDeclaration" => Some(Self::FieldDeclaration),
            "ParameterDeclaration" => Some(Self::ParameterDeclaration),
            _ => None,
        }
    }
}
