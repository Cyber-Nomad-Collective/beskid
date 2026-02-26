use std::collections::HashSet;
use std::path::{Component, Path};

use crate::projects::error::ProjectError;
use crate::projects::model::{DependencySource, ProjectManifest};

pub fn validate_manifest(manifest: &ProjectManifest) -> Result<(), ProjectError> {
    if manifest.project.name.trim().is_empty() {
        return Err(ProjectError::Validation(
            "`project.name` is required".to_string(),
        ));
    }
    if manifest.project.version.trim().is_empty() {
        return Err(ProjectError::Validation(
            "`project.version` is required".to_string(),
        ));
    }
    if manifest.project.root.trim().is_empty() {
        return Err(ProjectError::Validation(
            "`project.root` cannot be empty".to_string(),
        ));
    }
    if manifest.targets.is_empty() {
        return Err(ProjectError::Validation(
            "at least one `target` block is required".to_string(),
        ));
    }

    let mut target_names = HashSet::new();
    for target in &manifest.targets {
        if !target_names.insert(target.name.clone()) {
            return Err(ProjectError::Validation(format!(
                "duplicate target label `{}`",
                target.name
            )));
        }
        validate_relative_entry_path(&target.entry)?;
    }

    let mut dependency_names = HashSet::new();
    for dependency in &manifest.dependencies {
        if !dependency_names.insert(dependency.name.clone()) {
            return Err(ProjectError::Validation(format!(
                "duplicate dependency label `{}`",
                dependency.name
            )));
        }

        match dependency.source {
            DependencySource::Path => {
                if dependency
                    .path
                    .as_deref()
                    .map(str::trim)
                    .unwrap_or("")
                    .is_empty()
                {
                    return Err(ProjectError::Validation(format!(
                        "dependency `{}` with source=\"path\" requires `path`",
                        dependency.name
                    )));
                }
            }
            DependencySource::Git => {
                if dependency
                    .url
                    .as_deref()
                    .map(str::trim)
                    .unwrap_or("")
                    .is_empty()
                {
                    return Err(ProjectError::Validation(format!(
                        "dependency `{}` with source=\"git\" requires `url`",
                        dependency.name
                    )));
                }
                if dependency
                    .rev
                    .as_deref()
                    .map(str::trim)
                    .unwrap_or("")
                    .is_empty()
                {
                    return Err(ProjectError::Validation(format!(
                        "dependency `{}` with source=\"git\" requires `rev`",
                        dependency.name
                    )));
                }
            }
            DependencySource::Registry => {
                if dependency
                    .version
                    .as_deref()
                    .map(str::trim)
                    .unwrap_or("")
                    .is_empty()
                {
                    return Err(ProjectError::Validation(format!(
                        "dependency `{}` with source=\"registry\" requires `version`",
                        dependency.name
                    )));
                }
            }
        }
    }

    Ok(())
}

fn validate_relative_entry_path(entry: &str) -> Result<(), ProjectError> {
    let path = Path::new(entry);
    if path.is_absolute() {
        return Err(ProjectError::Validation(format!(
            "target entry path must be relative: `{entry}`"
        )));
    }

    if path
        .components()
        .any(|component| matches!(component, Component::ParentDir))
    {
        return Err(ProjectError::Validation(format!(
            "target entry path cannot escape source root: `{entry}`"
        )));
    }

    Ok(())
}
