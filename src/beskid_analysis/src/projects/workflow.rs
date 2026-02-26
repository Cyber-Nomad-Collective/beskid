use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;

use crate::projects::error::ProjectError;
use crate::projects::model::{
    CompilePlan, MaterializedDependencyProject, PreparedProjectWorkspace,
};

pub const PROJECT_LOCK_FILE_NAME: &str = "Project.lock";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct WorkspacePrepareOptions {
    pub frozen: bool,
    pub locked: bool,
}

pub fn prepare_project_workspace(plan: &CompilePlan) -> Result<PreparedProjectWorkspace, ProjectError> {
    prepare_project_workspace_with_options(plan, WorkspacePrepareOptions::default())
}

pub fn prepare_project_workspace_with_options(
    plan: &CompilePlan,
    options: WorkspacePrepareOptions,
) -> Result<PreparedProjectWorkspace, ProjectError> {
    let deps_root = plan
        .project_root
        .join("obj")
        .join("beskid")
        .join("deps")
        .join("src");
    let root_materialized_project = plan
        .project_root
        .join("obj")
        .join("beskid")
        .join("root");
    fs::create_dir_all(&deps_root).map_err(|source| ProjectError::MaterializationCreateDir {
        path: deps_root.clone(),
        source,
    })?;

    let source_segment = plan
        .source_root
        .file_name()
        .map(|segment| segment.to_string_lossy().to_string())
        .unwrap_or_else(|| "Src".to_string());
    let materialized_source_root = root_materialized_project.join(source_segment);
    copy_directory_when_newer(&plan.source_root, &materialized_source_root)?;

    let mut lock_entries = Vec::with_capacity(plan.dependency_projects.len());
    let mut materialized_dependencies = Vec::with_capacity(plan.dependency_projects.len());

    for dependency in &plan.dependency_projects {
        let materialized_root = deps_root.join(materialized_dependency_id(
            &dependency.project_name,
            &dependency.manifest_path,
        ));
        copy_directory_when_newer(&dependency.project_root, &materialized_root)?;

        lock_entries.push(format!(
            "name={};manifest={};project={};source_root={};materialized_root={}",
            dependency.dependency_name,
            dependency.manifest_path.display(),
            dependency.project_root.display(),
            dependency.source_root.display(),
            materialized_root.display()
        ));

        let source_relative = dependency
            .source_root
            .strip_prefix(&dependency.project_root)
            .unwrap_or_else(|_| std::path::Path::new(""));
        materialized_dependencies.push(MaterializedDependencyProject {
            dependency_name: dependency.dependency_name.clone(),
            manifest_path: dependency.manifest_path.clone(),
            project_name: dependency.project_name.clone(),
            materialized_project_root: materialized_root.clone(),
            materialized_source_root: materialized_root.join(source_relative),
        });
    }

    lock_entries.sort();
    let lockfile_path = sync_project_lockfile(plan, &lock_entries, options)?;

    Ok(PreparedProjectWorkspace {
        lockfile_path,
        materialized_project_root: root_materialized_project,
        materialized_source_root,
        materialized_dependencies,
    })
}

fn sync_project_lockfile(
    plan: &CompilePlan,
    lock_entries: &[String],
    options: WorkspacePrepareOptions,
) -> Result<std::path::PathBuf, ProjectError> {
    let lock_path = plan.project_root.join(PROJECT_LOCK_FILE_NAME);

    if options.locked && !lock_path.is_file() {
        return Err(ProjectError::LockfileRequired { path: lock_path });
    }

    let mut content = String::new();
    content.push_str("# Project.lock v1\n");
    content.push_str(&format!("root_manifest={}\n", plan.manifest_path.display()));
    content.push_str(&format!("project_name={}\n", plan.project_name));
    content.push_str("dependencies:\n");
    for entry in lock_entries {
        content.push_str("- ");
        content.push_str(entry);
        content.push('\n');
    }

    if lock_path.is_file() {
        let existing = fs::read_to_string(&lock_path).map_err(|source| ProjectError::LockfileRead {
            path: lock_path.clone(),
            source,
        })?;
        if existing == content {
            return Ok(lock_path);
        }

        if options.frozen {
            return Err(ProjectError::LockfileFrozenMode);
        }

        if options.locked {
            return Err(ProjectError::LockfileOutOfDate {
                project: plan.project_name.clone(),
            });
        }
    } else if options.frozen {
        return Err(ProjectError::LockfileFrozenMode);
    }

    fs::write(&lock_path, content).map_err(|source| ProjectError::LockfileWrite {
        path: lock_path.clone(),
        source,
    })?;

    Ok(lock_path)
}

fn copy_directory_when_newer(source: &Path, destination: &Path) -> Result<(), ProjectError> {
    fs::create_dir_all(destination).map_err(|source| ProjectError::MaterializationCreateDir {
        path: destination.to_path_buf(),
        source,
    })?;

    for entry in fs::read_dir(source).map_err(|err| ProjectError::MaterializationReadDir {
        path: source.to_path_buf(),
        source: err,
    })? {
        let entry = entry.map_err(|err| ProjectError::MaterializationReadDir {
            path: source.to_path_buf(),
            source: err,
        })?;
        let entry_path = entry.path();
        let destination_path = destination.join(entry.file_name());
        let file_type = entry
            .file_type()
            .map_err(|source| ProjectError::MaterializationMetadata {
                path: entry_path.clone(),
                source,
            })?;

        if file_type.is_dir() {
            copy_directory_when_newer(&entry_path, &destination_path)?;
            continue;
        }

        if file_type.is_file() {
            copy_file_when_newer(&entry_path, &destination_path)?;
        }
    }

    Ok(())
}

fn copy_file_when_newer(source: &Path, destination: &Path) -> Result<(), ProjectError> {
    let should_copy = if destination.is_file() {
        let source_modified = fs::metadata(source)
            .and_then(|metadata| metadata.modified())
            .map_err(|err| ProjectError::MaterializationMetadata {
                path: source.to_path_buf(),
                source: err,
            })?;
        let destination_modified = fs::metadata(destination)
            .and_then(|metadata| metadata.modified())
            .map_err(|source| ProjectError::MaterializationMetadata {
                path: destination.to_path_buf(),
                source,
            })?;
        source_modified > destination_modified
    } else {
        true
    };

    if should_copy {
        if let Some(parent) = destination.parent() {
            fs::create_dir_all(parent).map_err(|source| ProjectError::MaterializationCreateDir {
                path: parent.to_path_buf(),
                source,
            })?;
        }
        fs::copy(source, destination).map_err(|err| ProjectError::MaterializationCopy {
            from: source.to_path_buf(),
            to: destination.to_path_buf(),
            source: err,
        })?;
    }

    Ok(())
}

fn materialized_dependency_id(project_name: &str, manifest_path: &Path) -> String {
    let mut hasher = DefaultHasher::new();
    manifest_path.to_string_lossy().hash(&mut hasher);
    let hash = hasher.finish();
    format!("{}-{hash:016x}", sanitize_segment(project_name))
}

fn sanitize_segment(value: &str) -> String {
    let mut result = String::new();
    for ch in value.chars() {
        if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
            result.push(ch);
        } else {
            result.push('_');
        }
    }
    if result.is_empty() {
        "dependency".to_string()
    } else {
        result
    }
}
