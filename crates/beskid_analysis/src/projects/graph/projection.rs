use std::collections::HashSet;

use daggy::petgraph::visit::EdgeRef;
use daggy::petgraph::Direction;
use daggy::NodeIndex;

use crate::projects::graph::project_graph::{
    ProjectGraph, ProjectGraphNode, UnresolvedDependency, UnresolvedDependencyKind,
};
use crate::projects::model::ResolvedDependencyProject;

pub fn collect_dependency_projects(graph: &ProjectGraph) -> Vec<ResolvedDependencyProject> {
    let mut visited = HashSet::new();
    let mut output = Vec::new();
    collect_dependency_projects_from_node(graph, graph.root, &mut visited, &mut output);
    output
}

pub fn collect_unresolved_dependencies(graph: &ProjectGraph) -> Vec<UnresolvedDependency> {
    graph
        .dag
        .graph()
        .node_weights()
        .filter_map(|node| match node {
            ProjectGraphNode::UnresolvedGitDependency {
                dependency_name,
                url,
                rev,
            } => Some(UnresolvedDependency {
                dependency_name: dependency_name.clone(),
                kind: UnresolvedDependencyKind::Git,
                descriptor: format!("{url}@{rev}"),
            }),
            ProjectGraphNode::UnresolvedRegistryDependency {
                dependency_name,
                version,
            } => Some(UnresolvedDependency {
                dependency_name: dependency_name.clone(),
                kind: UnresolvedDependencyKind::Registry,
                descriptor: version.clone(),
            }),
            _ => None,
        })
        .collect()
}

fn collect_dependency_projects_from_node(
    graph: &ProjectGraph,
    node: NodeIndex,
    visited: &mut HashSet<NodeIndex>,
    output: &mut Vec<ResolvedDependencyProject>,
) {
    let mut children = graph
        .dag
        .graph()
        .edges_directed(node, Direction::Outgoing)
        .filter_map(|edge| {
            let child = edge.target();
            match graph.dag.graph().node_weight(child) {
                Some(ProjectGraphNode::ResolvedPathDependency {
                    manifest_path,
                    ..
                }) => Some((manifest_path.display().to_string(), child)),
                _ => None,
            }
        })
        .collect::<Vec<_>>();

    children.sort_by(|left, right| left.0.cmp(&right.0));

    for (_, child) in children {
        if !visited.insert(child) {
            continue;
        }

        collect_dependency_projects_from_node(graph, child, visited, output);

        if let Some(ProjectGraphNode::ResolvedPathDependency {
            dependency_name,
            manifest_path,
            project_root,
            project_name,
            source_root,
        }) = graph.dag.graph().node_weight(child)
        {
            output.push(ResolvedDependencyProject {
                dependency_name: dependency_name.clone(),
                manifest_path: manifest_path.clone(),
                project_root: project_root.clone(),
                project_name: project_name.clone(),
                source_root: source_root.clone(),
            });
        }
    }
}
