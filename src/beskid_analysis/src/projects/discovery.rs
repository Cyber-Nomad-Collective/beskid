use std::path::{Path, PathBuf};

pub const PROJECT_FILE_NAME: &str = "Project.proj";
pub const STDLIB_PRELUDE_FALLBACK_FEATURE: &str = "stdlib-prelude-fallback";

pub fn discover_project_file(start: &Path) -> Option<PathBuf> {
    let start_dir = if start.is_dir() {
        start.to_path_buf()
    } else {
        start.parent()?.to_path_buf()
    };

    let mut current = start_dir;
    loop {
        let candidate = current.join(PROJECT_FILE_NAME);
        if candidate.is_file() {
            return Some(candidate);
        }

        if !current.pop() {
            return None;
        }
    }
}
