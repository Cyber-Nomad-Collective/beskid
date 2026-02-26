use std::collections::HashMap;

use tower_lsp_server::ls_types::Uri;

#[derive(Debug, Clone)]
pub struct Document {
    pub version: i32,
    pub text: String,
}

#[derive(Default)]
pub struct State {
    pub docs: HashMap<Uri, Document>,
}
