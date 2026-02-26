use std::collections::HashMap;
use std::path::Path;

use crate::projects::error::ProjectError;
use crate::projects::graph::loader::load_manifest_from_path;
use crate::projects::graph::pathing::{normalize_existing_path, project_root_from_manifest_path};
use crate::projects::graph::project_graph::{ProjectGraph, ProjectGraphNode};
use crate::projects::graph::resolver::resolve_dependencies;

pub fn build_project_graph(manifest_path: &Path) -> Result<ProjectGraph, ProjectError> {
    let root_manifest_path = normalize_existing_path(manifest_path);
    let root_project_root = project_root_from_manifest_path(&root_manifest_path)?;
    let root_manifest = load_manifest_from_path(&root_manifest_path)?;

    let mut dag = daggy::Dag::new();
    let root = dag.add_node(ProjectGraphNode::RootProject {
        manifest_path: root_manifest_path.clone(),
        project_root: root_project_root.clone(),
        project_name: root_manifest.project.name.clone(),
        source_root: root_project_root.join(&root_manifest.project.root),
    });

    let mut node_by_manifest = HashMap::new();
    node_by_manifest.insert(root_manifest_path.clone(), root);

    let mut visiting = vec![root_manifest_path.clone()];
    let mut has_std_dependency = false;

    resolve_dependencies(
        &mut dag,
        root,
        &root_manifest_path,
        &root_manifest,
        &mut node_by_manifest,
        &mut visiting,
        &mut has_std_dependency,
    )?;

    Ok(ProjectGraph {
        dag,
        root,
        root_manifest_path,
        root_project_root,
        root_manifest,
        node_by_manifest,
        has_std_dependency,
    })
}
