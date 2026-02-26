use std::fs;
use std::path::{Path, PathBuf};

use crate::projects::discovery::PROJECT_FILE_NAME;
use crate::projects::error::ProjectError;

pub fn normalize_existing_path(path: &Path) -> PathBuf {
    fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

pub fn project_root_from_manifest_path(path: &Path) -> Result<PathBuf, ProjectError> {
    path.parent().map(Path::to_path_buf).ok_or_else(|| {
        ProjectError::Validation("manifest path has no parent directory".to_string())
    })
}

pub fn dependency_manifest_path(project_root: &Path, relative_dependency_path: &str) -> PathBuf {
    normalize_existing_path(
        &project_root
            .join(relative_dependency_path)
            .join(PROJECT_FILE_NAME),
    )
}
