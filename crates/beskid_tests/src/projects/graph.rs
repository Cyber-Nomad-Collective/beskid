use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use beskid_analysis::projects::{
    PROJECT_FILE_NAME, ProjectError, build_project_graph, collect_dependency_projects,
};

fn temp_case_dir(name: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time ok")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "beskid_graph_tests_{name}_{}_{}",
        std::process::id(),
        nanos
    ));
    fs::create_dir_all(&dir).expect("create temp dir");
    dir
}

fn write_manifest(dir: &PathBuf, source: &str) -> PathBuf {
    let manifest_path = dir.join(PROJECT_FILE_NAME);
    fs::write(&manifest_path, source).expect("write manifest");
    manifest_path
}

#[test]
fn collect_unresolved_dependencies_reports_git_and_registry_nodes() {
    let dir = temp_case_dir("unresolved_nodes");
    let source = r#"
project {
  name = "App"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

dependency "RemoteStd" {
  source = "git"
  url = "git@example.com/std.git"
  rev = "abc123"
}

dependency "PkgCore" {
  source = "registry"
  version = "1.2.3"
}
"#;
    let manifest_path = write_manifest(&dir, source);

    let error = build_project_graph(&manifest_path).expect_err("graph should fail in v1");
    assert!(matches!(
        error,
        ProjectError::UnsupportedDependencySourceV1 { .. }
    ));

    let _ = fs::remove_dir_all(dir);
}

#[test]
fn collect_dependency_projects_is_dependency_first_and_deduplicated() {
    let root = temp_case_dir("dependency_projection_order");
    let app_dir = root.join("App");
    let core_dir = root.join("Core");
    let feature_dir = root.join("Feature");
    let util_dir = root.join("Util");
    fs::create_dir_all(&app_dir).expect("create app dir");
    fs::create_dir_all(&core_dir).expect("create core dir");
    fs::create_dir_all(&feature_dir).expect("create feature dir");
    fs::create_dir_all(&util_dir).expect("create util dir");

    write_manifest(
        &util_dir,
        r#"
project {
  name = "Util"
  version = "0.1.0"
}

target "UtilLib" {
  kind = "Lib"
  entry = "Util.bd"
}
"#,
    );

    write_manifest(
        &core_dir,
        r#"
project {
  name = "Core"
  version = "0.1.0"
}

target "CoreLib" {
  kind = "Lib"
  entry = "Core.bd"
}

dependency "Util" {
  source = "path"
  path = "../Util"
}
"#,
    );

    write_manifest(
        &feature_dir,
        r#"
project {
  name = "Feature"
  version = "0.1.0"
}

target "FeatureLib" {
  kind = "Lib"
  entry = "Feature.bd"
}

dependency "Util" {
  source = "path"
  path = "../Util"
}
"#,
    );

    let app_manifest_path = write_manifest(
        &app_dir,
        r#"
project {
  name = "App"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

dependency "Core" {
  source = "path"
  path = "../Core"
}

dependency "Feature" {
  source = "path"
  path = "../Feature"
}
"#,
    );

    let graph = build_project_graph(&app_manifest_path).expect("graph should build");
    let deps = collect_dependency_projects(&graph);

    assert_eq!(deps.len(), 3);
    assert_eq!(deps[0].dependency_name, "Util");
    assert_eq!(deps[1].dependency_name, "Core");
    assert_eq!(deps[2].dependency_name, "Feature");

    let _ = fs::remove_dir_all(root);
}
