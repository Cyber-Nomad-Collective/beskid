use std::path::PathBuf;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum ProjectError {
    #[error("failed to read manifest at {path}: {source}")]
    ReadManifest {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("manifest parse error: {0}")]
    Parse(String),
    #[error("manifest validation error: {0}")]
    Validation(String),
    #[error("project file not found from {0}")]
    ProjectFileNotFound(PathBuf),
    #[error("target `{0}` not found")]
    TargetNotFound(String),
    #[error("dependency `{dependency}` manifest not found at {path}")]
    DependencyManifestNotFound { dependency: String, path: PathBuf },
    #[error("dependency cycle detected: {0}")]
    DependencyCycle(String),
    #[error("unresolved external dependencies: {0}")]
    UnresolvedExternalDependencies(String),
    #[error("unsupported dependency source '{dependency_source}' in v1")]
    UnsupportedDependencySourceV1 { dependency_source: String },
    #[error("lockfile is out of date for project '{project}'")]
    LockfileOutOfDate { project: String },
    #[error("lockfile update forbidden in frozen mode")]
    LockfileFrozenMode,
    #[error("lockfile required in locked mode at {path}")]
    LockfileRequired { path: PathBuf },
    #[error("failed to read lockfile at {path}: {source}")]
    LockfileRead {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to write lockfile at {path}: {source}")]
    LockfileWrite {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to create materialization directory at {path}: {source}")]
    MaterializationCreateDir {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to read materialization directory at {path}: {source}")]
    MaterializationReadDir {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to read materialization metadata at {path}: {source}")]
    MaterializationMetadata {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to copy dependency source from {from} to {to}: {source}")]
    MaterializationCopy {
        from: PathBuf,
        to: PathBuf,
        #[source]
        source: std::io::Error,
    },
}

impl ProjectError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::ReadManifest { .. } => "E3002",
            Self::Parse(_) => "E3003",
            Self::Validation(_) => "E3004",
            Self::ProjectFileNotFound(_) => "E3001",
            Self::TargetNotFound(_) => "E3005",
            Self::DependencyManifestNotFound { .. } => "E3006",
            Self::DependencyCycle(_) => "E3007",
            Self::UnresolvedExternalDependencies(_) => "E3008",
            Self::UnsupportedDependencySourceV1 { .. } => "E3011",
            Self::LockfileRead { .. } => "E3020",
            Self::LockfileWrite { .. } => "E3021",
            Self::LockfileOutOfDate { .. } => "E3022",
            Self::LockfileFrozenMode => "E3023",
            Self::LockfileRequired { .. } => "E3023",
            Self::MaterializationCreateDir { .. } => "E3030",
            Self::MaterializationReadDir { .. } => "E3030",
            Self::MaterializationMetadata { .. } => "E3030",
            Self::MaterializationCopy { .. } => "E3031",
        }
    }
}
