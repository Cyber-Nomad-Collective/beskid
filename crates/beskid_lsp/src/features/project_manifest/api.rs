use beskid_analysis::projects::parse_manifest;
use serde_json::json;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use tower_lsp_server::ls_types::*;

use crate::position::offset_range_to_lsp;

pub fn is_manifest_uri(uri: &Uri) -> bool {
    uri.to_string().to_lowercase().ends_with(".proj")
}

fn is_ident_char(ch: char) -> bool {
    ch.is_alphanumeric() || ch == '_'
}

pub fn completion_prefix_at_offset(text: &str, offset: usize) -> &str {
    let safe_offset = offset.min(text.len());
    let mut start = safe_offset;
    while start > 0 {
        let Some(ch) = text[..start].chars().next_back() else {
            break;
        };
        if ch.is_alphanumeric() || ch == '_' {
            start -= ch.len_utf8();
            continue;
        }
        break;
    }
    &text[start..safe_offset]
}

pub fn token_at_offset(text: &str, offset: usize) -> Option<&str> {
    let safe_offset = offset.min(text.len());
    let mut start = safe_offset;
    while start > 0 {
        let ch = text[..start].chars().next_back()?;
        if ch.is_alphanumeric() || ch == '_' {
            start -= ch.len_utf8();
            continue;
        }
        break;
    }

    let mut end = safe_offset;
    while end < text.len() {
        let ch = text[end..].chars().next()?;
        if ch.is_alphanumeric() || ch == '_' {
            end += ch.len_utf8();
            continue;
        }
        break;
    }

    if start == end {
        None
    } else {
        Some(&text[start..end])
    }
}

pub fn token_references(text: &str, offset: usize) -> Vec<(usize, usize)> {
    let Some(token) = token_at_offset(text, offset) else {
        return Vec::new();
    };

    let mut references = Vec::new();
    let mut cursor = 0usize;
    while cursor < text.len() {
        let Some(local_idx) = text[cursor..].find(token) else {
            break;
        };
        let start = cursor + local_idx;
        let end = start + token.len();

        let boundary_before = start == 0
            || text[..start]
                .chars()
                .next_back()
                .is_none_or(|ch| !is_ident_char(ch));
        let boundary_after = end >= text.len()
            || text[end..]
                .chars()
                .next()
                .is_none_or(|ch| !is_ident_char(ch));
        if boundary_before && boundary_after {
            references.push((start, end));
        }

        cursor = end;
    }

    references
}

fn first_match_range(text: &str, needle: &str) -> Option<Range> {
    let start = text.find(needle)?;
    let end = start + needle.len();
    Some(offset_range_to_lsp(text, start, end))
}

fn build_document_symbol(
    name: String,
    detail: Option<String>,
    kind: SymbolKind,
    tags: Option<Vec<SymbolTag>>,
    range: Range,
    selection_range: Range,
) -> DocumentSymbol {
    serde_json::from_value(json!({
        "name": name,
        "detail": detail,
        "kind": kind,
        "tags": tags,
        "range": range,
        "selectionRange": selection_range,
        "children": null
    }))
    .expect("valid DocumentSymbol payload")
}

pub fn document_symbols(text: &str) -> Vec<DocumentSymbol> {
    let Ok(manifest) = parse_manifest(text) else {
        return Vec::new();
    };

    let mut symbols = Vec::new();
    if let Some(range) = first_match_range(text, "project") {
        symbols.push(build_document_symbol(
            manifest.project.name.clone(),
            Some("project".to_string()),
            SymbolKind::MODULE,
            None,
            range,
            range,
        ));
    }

    for target in manifest.targets {
        let needle = format!("target \"{}\"", target.name);
        let range = first_match_range(text, &needle)
            .unwrap_or_else(|| Range::new(Position::new(0, 0), Position::new(0, 0)));
        symbols.push(build_document_symbol(
            target.name,
            Some("target".to_string()),
            SymbolKind::CLASS,
            None,
            range,
            range,
        ));
    }

    for dependency in manifest.dependencies {
        let needle = format!("dependency \"{}\"", dependency.name);
        let range = first_match_range(text, &needle)
            .unwrap_or_else(|| Range::new(Position::new(0, 0), Position::new(0, 0)));
        symbols.push(build_document_symbol(
            dependency.name,
            Some("dependency".to_string()),
            SymbolKind::NAMESPACE,
            None,
            range,
            range,
        ));
    }

    symbols
}

pub fn completion_candidates() -> [(&'static str, CompletionItemKind, &'static str); 14] {
    [
        (
            "project",
            CompletionItemKind::MODULE,
            "Top-level project block",
        ),
        (
            "target",
            CompletionItemKind::MODULE,
            "Top-level target block",
        ),
        (
            "dependency",
            CompletionItemKind::MODULE,
            "Top-level dependency block",
        ),
        (
            "name",
            CompletionItemKind::FIELD,
            "Project or dependency name",
        ),
        ("version", CompletionItemKind::FIELD, "Version string"),
        ("root", CompletionItemKind::FIELD, "Source root folder"),
        (
            "kind",
            CompletionItemKind::FIELD,
            "Target kind: App | Lib | Test",
        ),
        ("entry", CompletionItemKind::FIELD, "Target entry file path"),
        (
            "source",
            CompletionItemKind::FIELD,
            "Dependency source kind",
        ),
        ("path", CompletionItemKind::FIELD, "Local dependency path"),
        ("url", CompletionItemKind::FIELD, "Git dependency URL"),
        ("rev", CompletionItemKind::FIELD, "Git dependency revision"),
        (
            "App",
            CompletionItemKind::ENUM_MEMBER,
            "Application target kind",
        ),
        (
            "Lib",
            CompletionItemKind::ENUM_MEMBER,
            "Library target kind",
        ),
    ]
}

pub fn hover_markdown(token: &str) -> Option<&'static str> {
    match token {
        "project" => Some("`project { ... }` defines project metadata."),
        "target" => Some("`target \"Name\" { ... }` defines a build target."),
        "dependency" => Some("`dependency \"Alias\" { ... }` defines a dependency."),
        "name" => Some("`name` is required in the `project` block."),
        "version" => Some("`version` is required in the `project` block."),
        "root" => Some("`root` is optional and defaults to `Src`."),
        "kind" => Some("`kind` must be one of `App`, `Lib`, or `Test`."),
        "entry" => Some("`entry` is required and relative to `project.root`."),
        "source" => Some("`source` must be `path`, `git`, or `registry`."),
        "path" => Some("`path` is required when `source = \"path\"`."),
        "url" => Some("`url` is required when `source = \"git\"`."),
        "rev" => Some("`rev` is required when `source = \"git\"`."),
        _ => None,
    }
}

fn file_path_from_uri(uri: &Uri) -> Option<PathBuf> {
    let raw = uri.to_string();
    raw.strip_prefix("file://").map(PathBuf::from)
}

fn file_uri_from_path(path: &Path) -> Option<Uri> {
    let raw = format!("file://{}", path.display());
    Uri::from_str(&raw).ok()
}

pub fn dependency_path_location(uri: &Uri, text: &str, offset: usize) -> Option<Location> {
    let mut consumed = 0usize;
    for line in text.lines() {
        let line_start = consumed;
        let line_end = consumed + line.len();
        consumed = line_end.saturating_add(1);

        let trimmed = line.trim();
        if !trimmed.starts_with("path") || !trimmed.contains('=') {
            continue;
        }

        let quote_start = line.find('"')?;
        let quote_end = line[quote_start + 1..].find('"')? + quote_start + 1;
        let value_start = line_start + quote_start + 1;
        let value_end = line_start + quote_end;
        if !(value_start <= offset && offset <= value_end) {
            continue;
        }

        let dep_rel = &line[quote_start + 1..quote_end];
        let current = file_path_from_uri(uri)?;
        let parent = current.parent()?;
        let target = parent.join(dep_rel).join("Project.proj");
        let dep_uri = file_uri_from_path(&target)?;
        return Some(Location {
            uri: dep_uri,
            range: Range::new(Position::new(0, 0), Position::new(0, 0)),
        });
    }
    None
}
