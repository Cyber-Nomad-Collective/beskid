use std::fs;
use std::path::Path;

use crate::projects::error::ProjectError;
use crate::projects::model::ProjectManifest;
use crate::projects::parser::parse_manifest;

pub fn load_manifest_from_path(path: &Path) -> Result<ProjectManifest, ProjectError> {
    let source = fs::read_to_string(path).map_err(|source| ProjectError::ReadManifest {
        path: path.to_path_buf(),
        source,
    })?;
    parse_manifest(&source)
}
