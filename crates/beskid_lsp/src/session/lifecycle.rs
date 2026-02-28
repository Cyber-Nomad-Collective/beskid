use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use tokio::sync::RwLock;
use tower_lsp_server::Client;
use tower_lsp_server::ls_types::Uri;

use crate::diagnostics::analyze_document;
use crate::session::store::{Document, State};

const ANALYSIS_CACHE_VERSION: u32 = 1;

fn is_project_manifest_uri(uri: &Uri) -> bool {
    uri.to_string().to_lowercase().ends_with(".proj")
}

fn hash_text(text: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    hasher.finish()
}

fn build_document_analysis(
    uri: &Uri,
    text: &str,
) -> Option<beskid_analysis::services::DocumentAnalysisSnapshot> {
    if is_project_manifest_uri(uri) {
        return None;
    }

    beskid_analysis::services::parse_program(text)
        .ok()
        .map(|program| beskid_analysis::services::build_document_analysis(&program))
}

pub async fn set_document(state: &RwLock<State>, uri: Uri, version: i32, text: String) {
    let text_hash = hash_text(&text);
    let mut write_state = state.write().await;

    if let Some(existing) = write_state.docs.get_mut(&uri) {
        if version < existing.version {
            return;
        }

        if existing.text_hash == text_hash
            && existing.analysis_cache_version == ANALYSIS_CACHE_VERSION
        {
            existing.version = version;
            existing.text = text;
            existing.analysis_cache_version = ANALYSIS_CACHE_VERSION;
            return;
        }
    }

    let analysis = build_document_analysis(&uri, &text);

    write_state.docs.insert(
        uri,
        Document {
            version,
            text,
            text_hash,
            analysis_cache_version: ANALYSIS_CACHE_VERSION,
            analysis,
        },
    );
}

pub async fn remove_document(state: &RwLock<State>, uri: &Uri) {
    state.write().await.docs.remove(uri);
}

pub async fn publish_diagnostics_for_uri(client: &Client, state: &RwLock<State>, uri: &Uri) {
    let snapshot = {
        let state = state.read().await;
        state.docs.get(uri).cloned()
    };

    let Some(doc) = snapshot else {
        return;
    };

    let diagnostics = analyze_document(uri, &doc.text);
    client
        .publish_diagnostics(uri.clone(), diagnostics, Some(doc.version))
        .await;
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use tower_lsp_server::ls_types::Uri;

    use super::{ANALYSIS_CACHE_VERSION, hash_text, set_document};
    use crate::session::store::{Document, State};

    fn source() -> String {
        "i32 main() { return 0; }".to_string()
    }

    fn uri() -> Uri {
        Uri::from_str("file:///cache_test.bd").expect("valid uri")
    }

    #[tokio::test]
    async fn set_document_ignores_stale_versions() {
        let state = tokio::sync::RwLock::new(State::default());
        let file_uri = uri();
        set_document(&state, file_uri.clone(), 2, source()).await;
        set_document(
            &state,
            file_uri.clone(),
            1,
            "i32 main() { return 1; }".to_string(),
        )
        .await;

        let read = state.read().await;
        let doc = read.docs.get(&file_uri).expect("document exists");
        assert_eq!(doc.version, 2);
        assert_eq!(doc.text, source());
    }

    #[tokio::test]
    async fn set_document_rebuilds_when_cache_version_changes() {
        let file_uri = uri();
        let text = source();
        let mut state = State::default();
        state.docs.insert(
            file_uri.clone(),
            Document {
                version: 1,
                text: text.clone(),
                text_hash: hash_text(&text),
                analysis_cache_version: ANALYSIS_CACHE_VERSION.saturating_sub(1),
                analysis: None,
            },
        );

        let state = tokio::sync::RwLock::new(state);
        set_document(&state, file_uri.clone(), 2, text).await;

        let read = state.read().await;
        let doc = read.docs.get(&file_uri).expect("document exists");
        assert_eq!(doc.version, 2);
        assert_eq!(doc.analysis_cache_version, ANALYSIS_CACHE_VERSION);
        assert!(doc.analysis.is_some());
    }
}
