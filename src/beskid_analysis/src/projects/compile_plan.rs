use std::fs;
use std::path::Path;

use crate::projects::error::ProjectError;
use crate::projects::graph::{
    build_project_graph, collect_dependency_projects, collect_unresolved_dependencies,
    UnresolvedDependencyKind,
};
use crate::projects::model::{
    CompilePlan, DependencySource, ProjectManifest, Target, TargetKind, UnresolvedDependencyNote,
    UnresolvedDependencyPolicy,
};
use crate::projects::parser::parse_manifest;

pub fn load_manifest_from_path(path: &Path) -> Result<ProjectManifest, ProjectError> {
    let source = fs::read_to_string(path).map_err(|source| ProjectError::ReadManifest {
        path: path.to_path_buf(),
        source,
    })?;
    parse_manifest(&source)
}

pub fn build_compile_plan(
    manifest_path: &Path,
    target_name: Option<&str>,
    allow_stdlib_prelude_fallback: bool,
) -> Result<CompilePlan, ProjectError> {
    build_compile_plan_with_policy(
        manifest_path,
        target_name,
        allow_stdlib_prelude_fallback,
        UnresolvedDependencyPolicy::Error,
    )
}

pub fn build_compile_plan_with_policy(
    manifest_path: &Path,
    target_name: Option<&str>,
    allow_stdlib_prelude_fallback: bool,
    unresolved_dependency_policy: UnresolvedDependencyPolicy,
) -> Result<CompilePlan, ProjectError> {
    let graph = build_project_graph(manifest_path)?;
    let dependency_projects = collect_dependency_projects(&graph);
    let unresolved_dependencies = collect_unresolved_dependencies(&graph)
        .into_iter()
        .map(|dependency| UnresolvedDependencyNote {
            dependency_name: dependency.dependency_name,
            source: match dependency.kind {
                UnresolvedDependencyKind::Git => DependencySource::Git,
                UnresolvedDependencyKind::Registry => DependencySource::Registry,
            },
            descriptor: dependency.descriptor,
        })
        .collect::<Vec<_>>();

    if unresolved_dependency_policy == UnresolvedDependencyPolicy::Error
        && !unresolved_dependencies.is_empty()
    {
        let details = unresolved_dependencies
            .iter()
            .map(|dependency| {
                format!(
                    "{}({:?}={})",
                    dependency.dependency_name, dependency.source, dependency.descriptor
                )
            })
            .collect::<Vec<_>>()
            .join(", ");
        return Err(ProjectError::UnresolvedExternalDependencies(details));
    }

    let has_std_dependency = graph.has_std_dependency;
    let manifest = graph.root_manifest;
    let project_root = graph.root_project_root;
    let normalized_manifest_path = graph.root_manifest_path;

    let target = match target_name {
        Some(name) => manifest
            .targets
            .iter()
            .find(|target| target.name == name)
            .cloned()
            .ok_or_else(|| ProjectError::TargetNotFound(name.to_string()))?,
        None => pick_default_target(&manifest.targets)
            .cloned()
            .ok_or_else(|| ProjectError::Validation("manifest must declare at least one target".to_string()))?,
    };

    Ok(CompilePlan {
        source_root: project_root.join(&manifest.project.root),
        project_root,
        manifest_path: normalized_manifest_path,
        project_name: manifest.project.name,
        target,
        dependency_projects,
        unresolved_dependencies,
        has_std_dependency,
        allow_stdlib_prelude_fallback: allow_stdlib_prelude_fallback && !has_std_dependency,
    })
}

fn pick_default_target(targets: &[Target]) -> Option<&Target> {
    targets
        .iter()
        .find(|target| target.kind == TargetKind::App)
        .or_else(|| targets.first())
}
