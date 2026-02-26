use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use beskid_analysis::projects::{
    PROJECT_FILE_NAME, PROJECT_LOCK_FILE_NAME, ProjectError, TargetKind,
    UnresolvedDependencyPolicy, build_compile_plan, build_compile_plan_with_policy,
    prepare_project_workspace,
};

fn temp_case_dir(name: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("time ok")
        .as_nanos();
    let dir = std::env::temp_dir().join(format!(
        "beskid_projects_tests_{name}_{}_{}",
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
fn compile_plan_picks_app_target_by_default() {
    let dir = temp_case_dir("default_app_target");
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "Library" {
  kind = "Lib"
  entry = "Lib.bd"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#;
    let manifest_path = write_manifest(&dir, source);

    let plan = build_compile_plan(&manifest_path, None).expect("plan should build");
    assert_eq!(plan.project_name, "MyApp");
    assert_eq!(plan.target.name, "App");
    assert_eq!(plan.target.kind, TargetKind::App);
    assert_eq!(plan.source_root, dir.join("Src"));

    let _ = fs::remove_dir_all(dir);
}

#[test]
fn compile_plan_uses_explicit_target_name() {
    let dir = temp_case_dir("explicit_target");
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "Library" {
  kind = "Lib"
  entry = "Lib.bd"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#;
    let manifest_path = write_manifest(&dir, source);

    let plan = build_compile_plan(&manifest_path, Some("Library")).expect("plan should build");
    assert_eq!(plan.target.name, "Library");
    assert_eq!(plan.target.kind, TargetKind::Lib);
    let _ = fs::remove_dir_all(dir);
}

#[test]
fn compile_plan_errors_on_missing_target() {
    let dir = temp_case_dir("missing_target");
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#;
    let manifest_path = write_manifest(&dir, source);

    let error = build_compile_plan(&manifest_path, Some("Tests")).expect_err("must fail");
    assert!(matches!(error, ProjectError::TargetNotFound(_)));

    let _ = fs::remove_dir_all(dir);
}

#[test]
fn compile_plan_resolves_path_dependencies_transitively() {
    let root = temp_case_dir("path_dependencies_transitive");
    let app_dir = root.join("App");
    let core_dir = root.join("Core");
    let util_dir = root.join("Util");
    fs::create_dir_all(&app_dir).expect("create app dir");
    fs::create_dir_all(&core_dir).expect("create core dir");
    fs::create_dir_all(&util_dir).expect("create util dir");

    let util_manifest = r#"
project {
  name = "Util"
  version = "0.1.0"
}

target "UtilLib" {
  kind = "Lib"
  entry = "Util.bd"
}
"#;
    write_manifest(&util_dir, util_manifest);

    let core_manifest = r#"
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
"#;
    write_manifest(&core_dir, core_manifest);

    let app_manifest = r#"
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
"#;
    let app_manifest_path = write_manifest(&app_dir, app_manifest);

    let plan = build_compile_plan(&app_manifest_path, None).expect("plan should build");
    assert_eq!(plan.dependency_projects.len(), 2);
    assert_eq!(plan.dependency_projects[0].dependency_name, "Util");
    assert_eq!(plan.dependency_projects[1].dependency_name, "Core");
    assert_eq!(plan.dependency_projects[0].project_name, "Util");
    assert_eq!(plan.dependency_projects[1].project_name, "Core");

    let _ = fs::remove_dir_all(root);
}

#[test]
fn prepare_project_workspace_generates_lockfile_and_materializes_dependencies() {
    let root = temp_case_dir("workspace_prepare_lock_and_materialize");
    let app_dir = root.join("App");
    let core_dir = root.join("Core");
    fs::create_dir_all(&app_dir).expect("create app dir");
    fs::create_dir_all(&core_dir).expect("create core dir");

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
"#,
    );
    fs::create_dir_all(core_dir.join("Src")).expect("create core src dir");
    fs::write(core_dir.join("Src").join("Core.bd"), "Fn Main() { }").expect("write core source");

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
"#,
    );
    fs::create_dir_all(app_dir.join("Src")).expect("create app src dir");
    fs::write(app_dir.join("Src").join("Main.bd"), "Fn Main() { }").expect("write app source");

    let plan = build_compile_plan(&app_manifest_path, None).expect("plan should build");
    let workspace = prepare_project_workspace(&plan).expect("workspace should prepare");

    let lockfile_path = app_dir.join(PROJECT_LOCK_FILE_NAME);
    assert!(lockfile_path.is_file());
    assert_eq!(workspace.lockfile_path, lockfile_path);
    assert_eq!(workspace.materialized_dependencies.len(), 1);
    assert_eq!(
        workspace.materialized_dependencies[0].dependency_name,
        "Core"
    );
    assert!(
        workspace.materialized_dependencies[0]
            .materialized_source_root
            .is_dir()
    );
    let lock_content = fs::read_to_string(&lockfile_path).expect("read lockfile");
    assert!(lock_content.contains("# Project.lock v1"));
    assert!(lock_content.contains("project_name=App"));
    assert!(lock_content.contains("name=Core"));

    let deps_src_root = app_dir.join("obj").join("beskid").join("deps").join("src");
    assert!(deps_src_root.is_dir());

    let mut materialized_manifest_count = 0usize;
    for entry in fs::read_dir(&deps_src_root).expect("read deps src dir") {
        let entry = entry.expect("valid deps entry");
        let dependency_root = entry.path();
        if dependency_root.join(PROJECT_FILE_NAME).is_file() {
            materialized_manifest_count += 1;
        }
    }
    assert!(materialized_manifest_count >= 1);

    let _ = fs::remove_dir_all(root);
}

#[test]
fn compile_plan_errors_when_dependency_manifest_missing() {
    let root = temp_case_dir("missing_dependency_manifest");
    let app_dir = root.join("App");
    fs::create_dir_all(&app_dir).expect("create app dir");

    let app_manifest = r#"
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
"#;
    let app_manifest_path = write_manifest(&app_dir, app_manifest);

    let error = build_compile_plan(&app_manifest_path, None).expect_err("must fail");
    assert!(matches!(
        error,
        ProjectError::DependencyManifestNotFound { .. }
    ));

    let _ = fs::remove_dir_all(root);
}

#[test]
fn compile_plan_errors_on_dependency_cycle() {
    let root = temp_case_dir("dependency_cycle");
    let app_dir = root.join("App");
    let core_dir = root.join("Core");
    fs::create_dir_all(&app_dir).expect("create app dir");
    fs::create_dir_all(&core_dir).expect("create core dir");

    let app_manifest = r#"
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
"#;
    let app_manifest_path = write_manifest(&app_dir, app_manifest);

    let core_manifest = r#"
project {
  name = "Core"
  version = "0.1.0"
}

target "CoreLib" {
  kind = "Lib"
  entry = "Core.bd"
}

dependency "App" {
  source = "path"
  path = "../App"
}
"#;
    write_manifest(&core_dir, core_manifest);

    let error = build_compile_plan(&app_manifest_path, None).expect_err("must fail");
    assert!(matches!(error, ProjectError::DependencyCycle(_)));

    let _ = fs::remove_dir_all(root);
}

#[test]
fn compile_plan_detects_std_dependency_when_present() {
    let root = temp_case_dir("std_dependency_disables_fallback");
    let app_dir = root.join("App");
    let std_dir = root.join("Std");
    fs::create_dir_all(&app_dir).expect("create app dir");
    fs::create_dir_all(&std_dir).expect("create std dir");

    let std_manifest = r#"
project {
  name = "Std"
  version = "0.1.0"
}

target "StdLib" {
  kind = "Lib"
  entry = "Prelude.bd"
}
"#;
    write_manifest(&std_dir, std_manifest);

    let app_manifest = r#"
project {
  name = "App"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

dependency "Std" {
  source = "path"
  path = "../Std"
}
"#;
    let app_manifest_path = write_manifest(&app_dir, app_manifest);

    let plan = build_compile_plan(&app_manifest_path, None).expect("plan should build");
    assert!(plan.has_std_dependency);

    let _ = fs::remove_dir_all(root);
}

#[test]
fn compile_plan_collects_unresolved_dependencies_in_warn_mode() {
    let dir = temp_case_dir("unresolved_warn_mode");
    let source = r#"
project {
  name = "MyApp"
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
"#;
    let manifest_path = write_manifest(&dir, source);

    let error =
        build_compile_plan_with_policy(&manifest_path, None, UnresolvedDependencyPolicy::Warn)
            .expect_err("provider-disabled dependency should fail in v1");
    assert!(matches!(
        error,
        ProjectError::UnsupportedDependencySourceV1 { .. }
    ));

    let _ = fs::remove_dir_all(dir);
}

#[test]
fn compile_plan_errors_on_unresolved_dependencies_in_strict_mode() {
    let dir = temp_case_dir("unresolved_strict_mode");
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

dependency "PkgCore" {
  source = "registry"
  version = "1.2.3"
}
"#;
    let manifest_path = write_manifest(&dir, source);

    let error =
        build_compile_plan_with_policy(&manifest_path, None, UnresolvedDependencyPolicy::Error)
            .expect_err("strict mode must fail");
    assert!(matches!(
        error,
        ProjectError::UnsupportedDependencySourceV1 { .. }
    ));

    let _ = fs::remove_dir_all(dir);
}

#[test]
fn compile_plan_cycle_error_includes_chain_separator() {
    let root = temp_case_dir("cycle_message_chain");
    let app_dir = root.join("App");
    let core_dir = root.join("Core");
    fs::create_dir_all(&app_dir).expect("create app dir");
    fs::create_dir_all(&core_dir).expect("create core dir");

    let app_manifest = r#"
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
"#;
    let app_manifest_path = write_manifest(&app_dir, app_manifest);

    let core_manifest = r#"
project {
  name = "Core"
  version = "0.1.0"
}

target "CoreLib" {
  kind = "Lib"
  entry = "Core.bd"
}

dependency "App" {
  source = "path"
  path = "../App"
}
"#;
    write_manifest(&core_dir, core_manifest);

    let error = build_compile_plan(&app_manifest_path, None).expect_err("must fail");
    let message = error.to_string();
    assert!(message.contains(" -> "));

    let _ = fs::remove_dir_all(root);
}
