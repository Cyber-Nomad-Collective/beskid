use std::collections::HashMap;
use std::path::PathBuf;

use daggy::{Dag, NodeIndex};

use crate::projects::model::{DependencySource, ProjectManifest};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProjectGraphNode {
    RootProject {
        manifest_path: PathBuf,
        project_root: PathBuf,
        project_name: String,
        source_root: PathBuf,
    },
    ResolvedPathDependency {
        dependency_name: String,
        manifest_path: PathBuf,
        project_root: PathBuf,
        project_name: String,
        source_root: PathBuf,
    },
    UnresolvedGitDependency {
        dependency_name: String,
        url: String,
        rev: String,
    },
    UnresolvedRegistryDependency {
        dependency_name: String,
        version: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DependencyEdge {
    pub dependency_name: String,
    pub source: DependencySource,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnresolvedDependencyKind {
    Git,
    Registry,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnresolvedDependency {
    pub dependency_name: String,
    pub kind: UnresolvedDependencyKind,
    pub descriptor: String,
}

#[derive(Debug)]
pub struct ProjectGraph {
    pub dag: Dag<ProjectGraphNode, DependencyEdge>,
    pub root: NodeIndex,
    pub root_manifest_path: PathBuf,
    pub root_project_root: PathBuf,
    pub root_manifest: ProjectManifest,
    pub node_by_manifest: HashMap<PathBuf, NodeIndex>,
    pub has_std_dependency: bool,
}
