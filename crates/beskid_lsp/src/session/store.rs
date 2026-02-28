use std::collections::HashMap;

use beskid_analysis::services::DocumentAnalysisSnapshot;
use tower_lsp_server::ls_types::Uri;

#[derive(Debug, Clone)]
pub struct Document {
    pub version: i32,
    pub text: String,
    pub text_hash: u64,
    pub analysis_cache_version: u32,
    pub analysis: Option<DocumentAnalysisSnapshot>,
}

#[derive(Default)]
pub struct State {
    pub docs: HashMap<Uri, Document>,
}
