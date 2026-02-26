use std::collections::HashMap;

use crate::projects::error::ProjectError;
use crate::projects::model::{
    Dependency, DependencySource, ProjectManifest, ProjectSection, Target, TargetKind,
};
use crate::projects::validator::validate_manifest;

#[derive(Debug)]
struct ParsedBlock {
    kind: String,
    label: Option<String>,
    fields: HashMap<String, String>,
}

#[derive(Debug, Default)]
struct ParsedBlocks {
    project: Option<ParsedBlock>,
    targets: Vec<ParsedBlock>,
    dependencies: Vec<ParsedBlock>,
}

pub fn parse_manifest(source: &str) -> Result<ProjectManifest, ProjectError> {
    let parsed = parse_blocks(source)?;
    let manifest = build_manifest(parsed)?;
    validate_manifest(&manifest)?;
    Ok(manifest)
}

fn parse_blocks(source: &str) -> Result<ParsedBlocks, ProjectError> {
    let mut lines = source.lines().enumerate();
    let mut parsed = ParsedBlocks::default();

    while let Some((line_no, line)) = lines.next() {
        let trimmed = strip_comment(line).trim();
        if trimmed.is_empty() {
            continue;
        }

        let (kind, label) = parse_block_header(trimmed)
            .map_err(|message| ProjectError::Parse(format!("line {}: {message}", line_no + 1)))?;

        let mut fields = HashMap::new();
        let mut closed = false;
        for (_, body_line) in lines.by_ref() {
            let body = strip_comment(body_line).trim();
            if body.is_empty() {
                continue;
            }
            if body == "}" {
                closed = true;
                break;
            }

            let (key, value) = parse_assignment(body)
                .map_err(|message| ProjectError::Parse(format!("line {}: {message}", line_no + 1)))?;
            fields.insert(key, value);
        }

        if !closed {
            return Err(ProjectError::Parse(format!(
                "line {}: missing closing `}}` for `{kind}` block",
                line_no + 1
            )));
        }

        let block = ParsedBlock {
            kind: kind.to_string(),
            label,
            fields,
        };

        match block.kind.as_str() {
            "project" => parsed.project = Some(block),
            "target" => parsed.targets.push(block),
            "dependency" => parsed.dependencies.push(block),
            other => {
                return Err(ProjectError::Parse(format!(
                    "line {}: unknown block kind `{other}`",
                    line_no + 1
                )));
            }
        }
    }

    Ok(parsed)
}

fn build_manifest(parsed: ParsedBlocks) -> Result<ProjectManifest, ProjectError> {
    let project = parsed
        .project
        .ok_or_else(|| ProjectError::Validation("missing required `project` block".to_string()))?;

    let project_section = ProjectSection {
        name: required_field(&project.fields, "name")?,
        version: required_field(&project.fields, "version")?,
        root: project
            .fields
            .get("root")
            .cloned()
            .unwrap_or_else(|| "Src".to_string()),
    };

    let mut targets = Vec::with_capacity(parsed.targets.len());
    for target in parsed.targets {
        let kind = match required_field(&target.fields, "kind")?.as_str() {
            "App" => TargetKind::App,
            "Lib" => TargetKind::Lib,
            "Test" => TargetKind::Test,
            other => {
                return Err(ProjectError::Validation(format!(
                    "target `{}` has unsupported kind `{other}`",
                    target.label.as_deref().unwrap_or("<unnamed>")
                )));
            }
        };

        targets.push(Target {
            name: target
                .label
                .ok_or_else(|| {
                    ProjectError::Validation("target block must include a label".to_string())
                })?,
            kind,
            entry: required_field(&target.fields, "entry")?,
        });
    }

    let mut dependencies = Vec::with_capacity(parsed.dependencies.len());
    for dependency in parsed.dependencies {
        let source = match required_field(&dependency.fields, "source")?.as_str() {
            "path" => DependencySource::Path,
            "git" => DependencySource::Git,
            "registry" => DependencySource::Registry,
            other => {
                return Err(ProjectError::Validation(format!(
                    "dependency `{}` has unsupported source `{other}`",
                    dependency.label.as_deref().unwrap_or("<unnamed>")
                )));
            }
        };

        dependencies.push(Dependency {
            name: dependency.label.ok_or_else(|| {
                ProjectError::Validation("dependency block must include a label".to_string())
            })?,
            source,
            path: dependency.fields.get("path").cloned(),
            url: dependency.fields.get("url").cloned(),
            rev: dependency.fields.get("rev").cloned(),
            version: dependency.fields.get("version").cloned(),
        });
    }

    Ok(ProjectManifest {
        project: project_section,
        targets,
        dependencies,
    })
}

fn required_field(fields: &HashMap<String, String>, key: &str) -> Result<String, ProjectError> {
    fields
        .get(key)
        .cloned()
        .ok_or_else(|| ProjectError::Validation(format!("missing required field `{key}`")))
}

fn parse_block_header(line: &str) -> Result<(&str, Option<String>), String> {
    if !line.ends_with('{') {
        return Err("expected block opening `{`".to_string());
    }

    let without_brace = line.trim_end_matches('{').trim();
    if without_brace.is_empty() {
        return Err("empty block header".to_string());
    }

    let mut parts = without_brace.split_whitespace();
    let kind = parts.next().ok_or_else(|| "missing block kind".to_string())?;
    let rest = without_brace[kind.len()..].trim();

    if rest.is_empty() {
        return Ok((kind, None));
    }

    let label = parse_quoted(rest)?;
    Ok((kind, Some(label)))
}

fn parse_assignment(line: &str) -> Result<(String, String), String> {
    let (left, right) = line
        .split_once('=')
        .ok_or_else(|| "expected key = value assignment".to_string())?;

    let key = left.trim();
    if key.is_empty() {
        return Err("assignment key cannot be empty".to_string());
    }

    let value = parse_quoted(right.trim())?;
    Ok((key.to_string(), value))
}

fn parse_quoted(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if !(trimmed.starts_with('"') && trimmed.ends_with('"') && trimmed.len() >= 2) {
        return Err(format!("expected quoted string, found `{trimmed}`"));
    }

    Ok(trimmed[1..trimmed.len() - 1].to_string())
}

fn strip_comment(input: &str) -> &str {
    let hash = input.find('#');
    let slash = input.find("//");
    match (hash, slash) {
        (Some(h), Some(s)) => &input[..h.min(s)],
        (Some(h), None) => &input[..h],
        (None, Some(s)) => &input[..s],
        (None, None) => input,
    }
}
