use beskid_analysis::projects::{ProjectError, parse_manifest};

fn base_manifest() -> &'static str {
    r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#
}

#[test]
fn parses_minimal_manifest() {
    let source = base_manifest();

    let manifest = parse_manifest(source).expect("valid manifest");
    assert_eq!(manifest.project.root, "Src");
    assert_eq!(manifest.targets.len(), 1);
    assert_eq!(manifest.targets[0].name, "App");
}

#[test]
fn parses_manifest_with_comments() {
    let source = r#"
# project metadata
project {
  name = "MyApp" // app name
  version = "0.1.0"
  root = "Src"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#;

    let manifest = parse_manifest(source).expect("valid manifest");
    assert_eq!(manifest.project.name, "MyApp");
}

#[test]
fn rejects_missing_project_block() {
    let source = r#"
target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_missing_required_project_fields() {
    let source = r#"
project {
  name = "MyApp"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_duplicate_target_labels() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

target "App" {
  kind = "Test"
  entry = "Tests.bd"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_duplicate_dependency_labels() {
    let source = r#"
project {
  name = "MyApp"
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

dependency "Std" {
  source = "git"
  url = "git@example.com:std.git"
  rev = "abc123"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_unknown_dependency_source() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

dependency "X" {
  source = "weird"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_unknown_target_kind() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "Runner"
  entry = "Main.bd"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_absolute_entry_path() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "/Main.bd"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn rejects_parent_dir_entry_path() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "../Main.bd"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Validation(_)));
}

#[test]
fn accepts_nested_relative_entry_path() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Net/Main.bd"
}
"#;

    let manifest = parse_manifest(source).expect("valid manifest");
    assert_eq!(manifest.targets[0].entry, "Net/Main.bd");
}

#[test]
fn enforces_dependency_fields_by_source_type() {
    let path_missing = format!(
        "{}\ndependency \"Std\" {{\n  source = \"path\"\n}}\n",
        base_manifest()
    );
    let git_missing = format!(
        "{}\ndependency \"Std\" {{\n  source = \"git\"\n  url = \"git@example.com:std.git\"\n}}\n",
        base_manifest()
    );
    let registry_missing = format!(
        "{}\ndependency \"Std\" {{\n  source = \"registry\"\n}}\n",
        base_manifest()
    );

    assert!(matches!(
        parse_manifest(&path_missing),
        Err(ProjectError::Validation(_))
    ));
    assert!(matches!(
        parse_manifest(&git_missing),
        Err(ProjectError::Validation(_))
    ));
    assert!(matches!(
        parse_manifest(&registry_missing),
        Err(ProjectError::Validation(_))
    ));
}

#[test]
fn rejects_unknown_top_level_block_kind() {
    let source = r#"
project {
  name = "MyApp"
  version = "0.1.0"
}

target "App" {
  kind = "App"
  entry = "Main.bd"
}

workspace {
  name = "Root"
}
"#;

    let error = parse_manifest(source).expect_err("must fail");
    assert!(matches!(error, ProjectError::Parse(_)));
}
