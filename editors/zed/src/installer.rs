#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum InstallStatus {
    CheckingForUpdate,
    Downloading,
    None,
    Failed(String),
}

pub(crate) trait InstallStatusSink {
    fn set(&mut self, status: InstallStatus);
}

pub(crate) trait CacheInstaller {
    fn exists(&self, path: &str) -> bool;
    fn remove_file(&mut self, path: &str) -> Result<(), String>;
    fn download(&mut self, url: &str, path: &str) -> Result<(), String>;
    fn make_executable(&mut self, path: &str) -> Result<(), String>;
    fn rename(&mut self, source: &str, destination: &str) -> Result<(), String>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct CachePaths {
    pub(crate) final_path: String,
    pub(crate) temporary_path: String,
}

pub(crate) fn cache_paths(binary_name: &str, release_version: &str) -> CachePaths {
    let final_path = format!("./{binary_name}-{release_version}");
    CachePaths {
        temporary_path: format!("{final_path}.partial"),
        final_path,
    }
}

pub(crate) fn run_install<T>(
    status: &mut impl InstallStatusSink,
    install: impl FnOnce(&mut dyn InstallStatusSink) -> Result<T, String>,
) -> Result<T, String> {
    status.set(InstallStatus::CheckingForUpdate);
    match install(status) {
        Ok(value) => {
            status.set(InstallStatus::None);
            Ok(value)
        }
        Err(error) => {
            status.set(InstallStatus::Failed(error.clone()));
            Err(error)
        }
    }
}

pub(crate) fn install_cache(
    status: &mut dyn InstallStatusSink,
    cache: &mut impl CacheInstaller,
    paths: &CachePaths,
    download_url: &str,
    executable: bool,
) -> Result<String, String> {
    if cache.exists(&paths.final_path) {
        if executable {
            cache.make_executable(&paths.final_path)?;
        }
        return Ok(paths.final_path.clone());
    }

    if cache.exists(&paths.temporary_path) {
        cache.remove_file(&paths.temporary_path)?;
    }

    status.set(InstallStatus::Downloading);
    cache.download(download_url, &paths.temporary_path)?;
    if executable {
        cache.make_executable(&paths.temporary_path)?;
    }
    cache.rename(&paths.temporary_path, &paths.final_path)?;
    if executable {
        cache.make_executable(&paths.final_path)?;
    }

    Ok(paths.final_path.clone())
}
