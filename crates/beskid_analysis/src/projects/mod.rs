pub mod compile_plan;
pub mod discovery;
pub mod error;
pub mod graph;
pub mod model;
pub mod parser;
pub mod validator;
pub mod workflow;

pub use compile_plan::{
    build_compile_plan, build_compile_plan_with_policy, load_manifest_from_path,
};
pub use discovery::{PROJECT_FILE_NAME, discover_project_file};
pub use error::ProjectError;
pub use graph::{
    DependencyEdge, ProjectGraph, ProjectGraphNode, UnresolvedDependency, UnresolvedDependencyKind,
    build_project_graph, collect_dependency_projects, collect_unresolved_dependencies,
};
pub use model::{
    CompilePlan, Dependency, DependencySource, MaterializedDependencyProject,
    PreparedProjectWorkspace, ProjectManifest, ProjectSection, ResolvedDependencyProject, Target,
    TargetKind, UnresolvedDependencyNote, UnresolvedDependencyPolicy,
};
pub use parser::parse_manifest;
pub use validator::validate_manifest;
pub use workflow::{
    PROJECT_LOCK_FILE_NAME, WorkspacePrepareOptions, prepare_project_workspace,
    prepare_project_workspace_with_options,
};
