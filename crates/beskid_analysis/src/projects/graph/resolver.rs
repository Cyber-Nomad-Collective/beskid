use std::collections::HashMap;
use std::path::{Path, PathBuf};

use daggy::{Dag, NodeIndex};

use crate::projects::error::ProjectError;
use crate::projects::graph::loader::load_manifest_from_path;
use crate::projects::graph::pathing::{dependency_manifest_path, project_root_from_manifest_path};
use crate::projects::graph::project_graph::{DependencyEdge, ProjectGraphNode};
use crate::projects::model::{DependencySource, ProjectManifest};

#[allow(clippy::too_many_arguments)]
pub fn resolve_dependencies(
    dag: &mut Dag<ProjectGraphNode, DependencyEdge>,
    consumer_index: NodeIndex,
    consumer_manifest_path: &Path,
    consumer_manifest: &ProjectManifest,
    node_by_manifest: &mut HashMap<PathBuf, NodeIndex>,
    visiting: &mut Vec<PathBuf>,
    has_std_dependency: &mut bool,
) -> Result<(), ProjectError> {
    let consumer_project_root = project_root_from_manifest_path(consumer_manifest_path)?;

    for dependency in &consumer_manifest.dependencies {
        match dependency.source {
            DependencySource::Path => {
                let relative_path = dependency.path.as_deref().ok_or_else(|| {
                    ProjectError::Validation(format!(
                        "dependency `{}` with source=\"path\" requires `path`",
                        dependency.name
                    ))
                })?;

                let dependency_manifest_path =
                    dependency_manifest_path(&consumer_project_root, relative_path);

                if !dependency_manifest_path.is_file() {
                    return Err(ProjectError::DependencyManifestNotFound {
                        dependency: dependency.name.clone(),
                        path: dependency_manifest_path,
                    });
                }

                if let Some(cycle_start) = visiting
                    .iter()
                    .position(|path| path == &dependency_manifest_path)
                {
                    return Err(ProjectError::DependencyCycle(format_cycle_from_visiting(
                        visiting,
                        cycle_start,
                        &dependency_manifest_path,
                    )));
                }

                let dependency_index =
                    if let Some(existing_index) = node_by_manifest.get(&dependency_manifest_path) {
                        *existing_index
                    } else {
                        let dependency_manifest = load_manifest_from_path(&dependency_manifest_path)?;
                        let dependency_project_root =
                            project_root_from_manifest_path(&dependency_manifest_path)?;
                        let dependency_source_root =
                            dependency_project_root.join(&dependency_manifest.project.root);

                        let dependency_index = dag.add_node(ProjectGraphNode::ResolvedPathDependency {
                            dependency_name: dependency.name.clone(),
                            manifest_path: dependency_manifest_path.clone(),
                            project_root: dependency_project_root,
                            project_name: dependency_manifest.project.name.clone(),
                            source_root: dependency_source_root,
                        });

                        node_by_manifest.insert(dependency_manifest_path.clone(), dependency_index);

                        visiting.push(dependency_manifest_path.clone());
                        resolve_dependencies(
                            dag,
                            dependency_index,
                            &dependency_manifest_path,
                            &dependency_manifest,
                            node_by_manifest,
                            visiting,
                            has_std_dependency,
                        )?;
                        visiting.pop();

                        dependency_index
                    };

                if dag
                    .add_edge(
                        consumer_index,
                        dependency_index,
                        DependencyEdge {
                            dependency_name: dependency.name.clone(),
                            source: dependency.source,
                        },
                    )
                    .is_err()
                {
                    return Err(ProjectError::DependencyCycle(format!(
                        "{} -> {} -> {}",
                        consumer_manifest_path.display(),
                        dependency_manifest_path.display(),
                        consumer_manifest_path.display()
                    )));
                }

                if dependency.name.eq_ignore_ascii_case("Std") {
                    *has_std_dependency = true;
                }
            }
            DependencySource::Git => {
                return Err(ProjectError::UnsupportedDependencySourceV1 {
                    dependency_source: "git".to_string(),
                });
            }
            DependencySource::Registry => {
                return Err(ProjectError::UnsupportedDependencySourceV1 {
                    dependency_source: "registry".to_string(),
                });
            }
        }
    }

    Ok(())
}

fn format_cycle_from_visiting(
    visiting: &[PathBuf],
    cycle_start: usize,
    repeated_path: &Path,
) -> String {
    let mut cycle_chain = visiting[cycle_start..]
        .iter()
        .map(|path| path.display().to_string())
        .collect::<Vec<_>>();
    cycle_chain.push(repeated_path.display().to_string());
    cycle_chain.join(" -> ")
}
