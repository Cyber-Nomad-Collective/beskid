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
    fn is_file(&self, path: &str) -> bool;
    fn remove_file(&mut self, path: &str) -> Result<(), String>;
    fn download(&mut self, url: &str, path: &str) -> Result<(), String>;
    fn read_to_string(&mut self, path: &str) -> Result<String, String>;
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

pub(crate) fn validate_release_version(projection: &str) -> Result<String, String> {
    let version = projection.trim();
    let starts_with_version_number = version
        .bytes()
        .next()
        .is_some_and(|character| character.is_ascii_digit())
        || version
            .strip_prefix('v')
            .and_then(|suffix| suffix.bytes().next())
            .is_some_and(|character| character.is_ascii_digit());
    if version.is_empty()
        || version.len() > 128
        || version.contains("..")
        || !starts_with_version_number
        || !version.bytes().all(|character| {
            character.is_ascii_alphanumeric() || matches!(character, b'.' | b'_' | b'-')
        })
    {
        return Err("invalid immutable release version projection".into());
    }

    Ok(version.into())
}

pub(crate) fn fetch_version_projection(
    cache: &mut impl CacheInstaller,
    projection_url: &str,
    binary_name: &str,
    rolling_tag: &str,
) -> Result<String, String> {
    let temporary_path = format!("./{binary_name}-{rolling_tag}.version.partial");
    if cache.exists(&temporary_path) {
        cache.remove_file(&temporary_path)?;
    }

    let download = cache.download(projection_url, &temporary_path);
    if let Err(error) = download {
        return match cache.remove_file(&temporary_path) {
            Ok(()) => Err(error),
            Err(cleanup_error) => Err(format!(
                "{error}; additionally failed to remove version projection temporary file: {cleanup_error}"
            )),
        };
    }

    let contents = cache.read_to_string(&temporary_path);
    let cleanup = cache.remove_file(&temporary_path);
    let contents = contents?;
    cleanup?;
    validate_release_version(&contents)
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
        if !cache.is_file(&paths.final_path) {
            return Err(format!(
                "cached language server is not a regular file: {}",
                paths.final_path
            ));
        }
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
