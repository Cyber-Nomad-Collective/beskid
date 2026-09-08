use std::path::Path;

use installer::{
    cache_paths, fetch_version_projection, install_cache, run_install, CacheInstaller,
    InstallStatus, InstallStatusSink,
};
use language_server::{platform_for_download, select_launch, LaunchChoice, LaunchSettings};
use platform::{platform_asset, Arch, Os, PlatformAsset};
use settings::{forward_initialization_options, forward_workspace_configuration, user_override};
use zed_extension_api as zed;

mod installer;
mod language_server;
mod platform;
mod settings;

const BESKID_REPO: &str = "Cyber-Nomad-Collective/beskid_compiler";
const BESKID_RELEASE_TAG: &str = "lsp-stable";
const BESKID_RELEASE_VERSION_PROJECTION: &str = "lsp-version.txt";
const BESKID_LANGUAGE_SERVER_ID: &str = "beskid-lsp";

struct BeskidExtension;

struct ZedStatus<'a> {
    language_server_id: &'a zed::LanguageServerId,
}

impl InstallStatusSink for ZedStatus<'_> {
    fn set(&mut self, status: InstallStatus) {
        let status = match status {
            InstallStatus::CheckingForUpdate => {
                zed::LanguageServerInstallationStatus::CheckingForUpdate
            }
            InstallStatus::Downloading => zed::LanguageServerInstallationStatus::Downloading,
            InstallStatus::None => zed::LanguageServerInstallationStatus::None,
            InstallStatus::Failed(error) => zed::LanguageServerInstallationStatus::Failed(error),
        };
        zed::set_language_server_installation_status(self.language_server_id, &status);
    }
}

struct ZedCache;

impl CacheInstaller for ZedCache {
    fn exists(&self, path: &str) -> bool {
        Path::new(path).exists()
    }

    fn remove_file(&mut self, path: &str) -> Result<(), String> {
        std::fs::remove_file(path).map_err(|error| format!("failed to remove {path}: {error}"))
    }

    fn download(&mut self, url: &str, path: &str) -> Result<(), String> {
        zed::download_file(url, path, zed::DownloadedFileType::Uncompressed)
    }

    fn read_to_string(&mut self, path: &str) -> Result<String, String> {
        std::fs::read_to_string(path).map_err(|error| format!("failed to read {path}: {error}"))
    }

    fn make_executable(&mut self, path: &str) -> Result<(), String> {
        zed::make_file_executable(path)
    }

    fn rename(&mut self, source: &str, destination: &str) -> Result<(), String> {
        std::fs::rename(source, destination)
            .map_err(|error| format!("failed to promote {source} to {destination}: {error}"))
    }
}

impl zed::Extension for BeskidExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        require_beskid_language_server(language_server_id)?;

        let settings =
            zed::settings::LspSettings::for_worktree(BESKID_LANGUAGE_SERVER_ID, worktree)?;
        let override_settings = user_override(settings)?;
        let lsp_path = worktree.which("beskid_lsp");
        let cli_path = worktree.which("beskid");

        let launch_settings =
            match select_launch(override_settings, lsp_path.as_deref(), cli_path.as_deref()) {
                launch_choice @ LaunchChoice::Download => {
                    let platform_asset =
                        platform_for_download(&launch_choice, current_platform_asset)?.ok_or_else(
                            || "download choice did not resolve a platform asset".to_string(),
                        )?;
                    let path = download_beskid_lsp(platform_asset, language_server_id)?;
                    LaunchSettings {
                        path: Some(path),
                        arguments: vec!["--stdio".into()],
                        environment: Vec::new(),
                    }
                }
                launch_choice => launch_choice.command(),
            };

        command_for_launch(worktree.shell_env(), launch_settings)
    }

    fn language_server_initialization_options(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<Option<zed::serde_json::Value>> {
        require_beskid_language_server(language_server_id)?;
        let settings =
            zed::settings::LspSettings::for_worktree(BESKID_LANGUAGE_SERVER_ID, worktree)?;
        Ok(forward_initialization_options(
            settings.initialization_options,
        ))
    }

    fn language_server_workspace_configuration(
        &mut self,
        language_server_id: &zed::LanguageServerId,
        worktree: &zed::Worktree,
    ) -> zed::Result<Option<zed::serde_json::Value>> {
        require_beskid_language_server(language_server_id)?;
        let settings =
            zed::settings::LspSettings::for_worktree(BESKID_LANGUAGE_SERVER_ID, worktree)?;
        Ok(forward_workspace_configuration(settings.settings))
    }
}

fn require_beskid_language_server(language_server_id: &zed::LanguageServerId) -> zed::Result<()> {
    if language_server_id.as_ref() == BESKID_LANGUAGE_SERVER_ID {
        return Ok(());
    }

    Err(format!("unsupported language server: {language_server_id}"))
}

fn current_platform_asset() -> zed::Result<PlatformAsset> {
    let (os, arch) = zed::current_platform();
    let os = match os {
        zed::Os::Linux => Os::Linux,
        zed::Os::Mac => Os::Mac,
        zed::Os::Windows => Os::Windows,
    };
    let arch = match arch {
        zed::Architecture::X8664 => Arch::X86_64,
        zed::Architecture::Aarch64 => Arch::Aarch64,
        zed::Architecture::X86 => Arch::Other,
    };

    platform_asset(os, arch)
}

fn download_beskid_lsp(
    platform_asset: PlatformAsset,
    language_server_id: &zed::LanguageServerId,
) -> zed::Result<String> {
    let mut status = ZedStatus { language_server_id };
    run_install(&mut status, |status| {
        let release = zed::github_release_by_tag_name(BESKID_REPO, BESKID_RELEASE_TAG)?;
        let version_projection_url =
            release_asset_url(&release, BESKID_RELEASE_VERSION_PROJECTION)?;
        let release_version = fetch_version_projection(
            &mut ZedCache,
            &version_projection_url,
            platform_asset.binary_name,
            BESKID_RELEASE_TAG,
        )?;
        let download_url = release_asset_url(&release, platform_asset.asset_name)?;
        let paths = cache_paths(platform_asset.binary_name, &release_version);
        install_cache(
            status,
            &mut ZedCache,
            &paths,
            &download_url,
            platform_asset.executable,
        )
    })
}

fn release_asset_url(release: &zed::GithubRelease, asset_name: &str) -> zed::Result<String> {
    release
        .assets
        .iter()
        .find(|asset| asset.name == asset_name)
        .map(|asset| asset.download_url.to_string())
        .ok_or_else(|| {
            format!(
                "missing {} asset in {} release {}",
                asset_name, BESKID_REPO, BESKID_RELEASE_TAG
            )
        })
}

fn command_for_launch(
    mut shell_environment: zed::EnvVars,
    launch_settings: LaunchSettings,
) -> zed::Result<zed::Command> {
    let path = launch_settings.path.ok_or_else(|| {
        "Beskid LSP command resolution produced no executable path; configure lsp.beskid-lsp.binary.path or install beskid_lsp/beskid".to_string()
    })?;
    for (key, value) in launch_settings.environment {
        shell_environment.retain(|(existing_key, _)| existing_key != &key);
        shell_environment.push((key, value));
    }

    Ok(zed::Command::new(path)
        .args(launch_settings.arguments)
        .envs(shell_environment))
}

zed::register_extension!(BeskidExtension);

#[cfg(test)]
mod language_server_tests {
    use crate::language_server::{
        platform_for_download, select_launch, LaunchChoice, LaunchSettings,
    };

    #[test]
    fn override_has_priority_and_preserves_its_command_settings() {
        let override_settings = LaunchSettings {
            path: Some("/custom/beskid_lsp".into()),
            arguments: vec!["--custom".into(), "argument with spaces".into()],
            environment: vec![("BESKID_MODE".into(), "strict".into())],
        };

        assert_eq!(
            select_launch(
                Some(override_settings.clone()),
                Some("/bin/beskid_lsp"),
                Some("/bin/beskid"),
            ),
            LaunchChoice::Override(override_settings)
        );
    }

    #[test]
    fn path_candidates_follow_the_fixed_priority_order() {
        assert_eq!(
            select_launch(None, Some("/bin/beskid_lsp"), Some("/bin/beskid")),
            LaunchChoice::LspOnPath("/bin/beskid_lsp".into())
        );
        assert_eq!(
            select_launch(None, None, Some("/bin/beskid")),
            LaunchChoice::CliOnPath("/bin/beskid".into())
        );
        assert_eq!(select_launch(None, None, None), LaunchChoice::Download);
    }

    #[test]
    fn default_commands_use_the_supported_stdio_forms() {
        assert_eq!(
            LaunchChoice::LspOnPath("/bin/beskid_lsp".into()).command(),
            LaunchSettings {
                path: Some("/bin/beskid_lsp".into()),
                arguments: vec!["--stdio".into()],
                environment: Vec::new(),
            }
        );
        assert_eq!(
            LaunchChoice::CliOnPath("/bin/beskid".into()).command(),
            LaunchSettings {
                path: Some("/bin/beskid".into()),
                arguments: vec!["dev".into(), "tooling".into(), "lsp".into()],
                environment: Vec::new(),
            }
        );
    }

    #[test]
    fn only_download_requires_a_supported_platform() {
        let override_choice = select_launch(
            Some(LaunchSettings {
                path: Some("/custom/beskid_lsp".into()),
                arguments: Vec::new(),
                environment: Vec::new(),
            }),
            None,
            None,
        );
        assert_eq!(
            platform_for_download(&override_choice, || Err("unsupported platform".into())),
            Ok(None)
        );

        for path_choice in [
            select_launch(None, Some("/bin/beskid_lsp"), Some("/bin/beskid")),
            select_launch(None, None, Some("/bin/beskid")),
        ] {
            assert_eq!(
                platform_for_download(&path_choice, || Err("unsupported platform".into())),
                Ok(None)
            );
        }

        let download_choice = select_launch(None, None, None);
        assert_eq!(
            platform_for_download(&download_choice, || Err("unsupported platform".into())),
            Err("unsupported platform".into())
        );
    }
}

#[cfg(test)]
mod settings_tests {
    use crate::settings::{forward_initialization_options, forward_workspace_configuration};
    use zed_extension_api as zed;

    #[test]
    fn forwards_initialization_options_without_reinterpretation() {
        let value = zed::serde_json::json!({"nested": {"mode": "strict"}, "items": [1, 2]});
        assert_eq!(
            forward_initialization_options(Some(value.clone())),
            Some(value)
        );
        assert_eq!(forward_initialization_options(None), None);
    }

    #[test]
    fn forwards_workspace_settings_without_reinterpretation() {
        let value = zed::serde_json::json!({"analysis": {"enabled": true}, "unknown": null});
        assert_eq!(
            forward_workspace_configuration(Some(value.clone())),
            Some(value)
        );
        assert_eq!(forward_workspace_configuration(None), None);
    }
}

#[cfg(test)]
mod installer_tests {
    use crate::installer::{
        cache_paths, fetch_version_projection, install_cache, run_install,
        validate_release_version, CacheInstaller, InstallStatus, InstallStatusSink,
    };

    #[derive(Default)]
    struct RecordingStatus(Vec<InstallStatus>);

    impl InstallStatusSink for RecordingStatus {
        fn set(&mut self, status: InstallStatus) {
            self.0.push(status);
        }
    }

    #[derive(Clone, Copy)]
    enum Failure {
        Download,
        Chmod,
        Rename,
    }

    struct FakeCache {
        cached: bool,
        temporary: bool,
        failure: Option<Failure>,
        actions: Vec<String>,
    }

    impl FakeCache {
        fn fresh(failure: Option<Failure>) -> Self {
            Self {
                cached: false,
                temporary: false,
                failure,
                actions: Vec::new(),
            }
        }
    }

    impl CacheInstaller for FakeCache {
        fn exists(&self, path: &str) -> bool {
            if path.ends_with(".partial") {
                self.temporary
            } else {
                self.cached
            }
        }

        fn remove_file(&mut self, path: &str) -> Result<(), String> {
            self.actions.push(format!("remove {path}"));
            Ok(())
        }

        fn download(&mut self, _url: &str, path: &str) -> Result<(), String> {
            self.actions.push(format!("download {path}"));
            if matches!(self.failure, Some(Failure::Download)) {
                return Err("download failed".into());
            }
            Ok(())
        }

        fn read_to_string(&mut self, _path: &str) -> Result<String, String> {
            Err("unexpected projection read".into())
        }

        fn make_executable(&mut self, path: &str) -> Result<(), String> {
            self.actions.push(format!("chmod {path}"));
            if matches!(self.failure, Some(Failure::Chmod)) {
                return Err("chmod failed".into());
            }
            Ok(())
        }

        fn rename(&mut self, source: &str, destination: &str) -> Result<(), String> {
            self.actions.push(format!("rename {source} {destination}"));
            if matches!(self.failure, Some(Failure::Rename)) {
                return Err("rename failed".into());
            }
            Ok(())
        }
    }

    struct ProjectionCache {
        contents: Result<String, String>,
        actions: Vec<String>,
    }

    impl CacheInstaller for ProjectionCache {
        fn exists(&self, _path: &str) -> bool {
            false
        }

        fn remove_file(&mut self, path: &str) -> Result<(), String> {
            self.actions.push(format!("remove {path}"));
            Ok(())
        }

        fn download(&mut self, _url: &str, path: &str) -> Result<(), String> {
            self.actions.push(format!("download {path}"));
            Ok(())
        }

        fn read_to_string(&mut self, path: &str) -> Result<String, String> {
            self.actions.push(format!("read {path}"));
            self.contents.clone()
        }

        fn make_executable(&mut self, _path: &str) -> Result<(), String> {
            Ok(())
        }

        fn rename(&mut self, _source: &str, _destination: &str) -> Result<(), String> {
            Ok(())
        }
    }

    #[test]
    fn rolling_release_projections_produce_distinct_cache_paths() {
        let first = validate_release_version(" v1\n").unwrap();
        let second = validate_release_version("v2").unwrap();

        assert_eq!(
            cache_paths("beskid_lsp", &first).final_path,
            "./beskid_lsp-v1"
        );
        assert_eq!(
            cache_paths("beskid_lsp", &second).final_path,
            "./beskid_lsp-v2"
        );
    }

    #[test]
    fn unsafe_release_version_projections_fail_closed() {
        for projection in [
            "",
            "../v1",
            "v1/child",
            "v1\\child",
            "v1\nchild",
            "v1;child",
            "not-a-version",
            "..",
        ] {
            assert!(
                validate_release_version(projection).is_err(),
                "{projection:?}"
            );
        }
    }

    #[test]
    fn version_projection_is_read_from_a_temporary_file_then_removed() {
        let mut cache = ProjectionCache {
            contents: Ok("v2\n".into()),
            actions: Vec::new(),
        };

        assert_eq!(
            fetch_version_projection(
                &mut cache,
                "https://example.test/lsp-version.txt",
                "beskid_lsp",
                "lsp-stable",
            ),
            Ok("v2".into())
        );
        assert_eq!(
            cache.actions,
            vec![
                "download ./beskid_lsp-lsp-stable.version.partial",
                "read ./beskid_lsp-lsp-stable.version.partial",
                "remove ./beskid_lsp-lsp-stable.version.partial",
            ]
        );
    }

    #[test]
    fn failed_version_projection_is_removed_and_reports_failed_status() {
        let mut cache = ProjectionCache {
            contents: Err("projection read failed".into()),
            actions: Vec::new(),
        };
        let mut status = RecordingStatus::default();

        assert!(run_install::<String>(&mut status, |_| {
            fetch_version_projection(
                &mut cache,
                "https://example.test/lsp-version.txt",
                "beskid_lsp",
                "lsp-stable",
            )
        })
        .is_err());
        assert_eq!(
            cache.actions,
            vec![
                "download ./beskid_lsp-lsp-stable.version.partial",
                "read ./beskid_lsp-lsp-stable.version.partial",
                "remove ./beskid_lsp-lsp-stable.version.partial",
            ]
        );
        assert!(matches!(status.0.last(), Some(InstallStatus::Failed(_))));
    }

    #[test]
    fn only_successful_downloads_promote_a_versioned_temp_file() {
        let paths = cache_paths("beskid_lsp", "v1");
        let mut status = RecordingStatus::default();
        let mut cache = FakeCache::fresh(None);

        let path = run_install(&mut status, |status| {
            install_cache(
                status,
                &mut cache,
                &paths,
                "https://example.test/asset",
                true,
            )
        })
        .unwrap();

        assert_eq!(path, "./beskid_lsp-v1");
        assert_eq!(
            cache.actions,
            vec![
                "download ./beskid_lsp-v1.partial",
                "chmod ./beskid_lsp-v1.partial",
                "rename ./beskid_lsp-v1.partial ./beskid_lsp-v1",
                "chmod ./beskid_lsp-v1",
            ]
        );
        assert_eq!(
            status.0,
            vec![
                InstallStatus::CheckingForUpdate,
                InstallStatus::Downloading,
                InstallStatus::None,
            ]
        );
    }

    #[test]
    fn cached_unix_binary_is_made_executable_before_launch() {
        let paths = cache_paths("beskid_lsp", "v1");
        let mut status = RecordingStatus::default();
        let mut cache = FakeCache {
            cached: true,
            temporary: false,
            failure: None,
            actions: Vec::new(),
        };

        run_install(&mut status, |status| {
            install_cache(
                status,
                &mut cache,
                &paths,
                "https://example.test/asset",
                true,
            )
        })
        .unwrap();

        assert_eq!(cache.actions, vec!["chmod ./beskid_lsp-v1"]);
    }

    #[test]
    fn stale_temporary_cache_file_is_replaced_before_download() {
        let paths = cache_paths("beskid_lsp", "v1");
        let mut status = RecordingStatus::default();
        let mut cache = FakeCache {
            cached: false,
            temporary: true,
            failure: None,
            actions: Vec::new(),
        };

        run_install(&mut status, |status| {
            install_cache(
                status,
                &mut cache,
                &paths,
                "https://example.test/asset",
                false,
            )
        })
        .unwrap();

        assert_eq!(
            cache.actions,
            vec![
                "remove ./beskid_lsp-v1.partial",
                "download ./beskid_lsp-v1.partial",
                "rename ./beskid_lsp-v1.partial ./beskid_lsp-v1",
            ]
        );
    }

    #[test]
    fn release_asset_download_and_chmod_failures_report_failed_status() {
        for failure in ["release failed", "asset failed"] {
            let mut status = RecordingStatus::default();
            assert_eq!(
                run_install::<()>(&mut status, |_| Err(failure.into())),
                Err(failure.into())
            );
            assert_eq!(
                status.0,
                vec![
                    InstallStatus::CheckingForUpdate,
                    InstallStatus::Failed(failure.into()),
                ]
            );
        }

        for failure in [Failure::Download, Failure::Chmod, Failure::Rename] {
            let paths = cache_paths("beskid_lsp", "v1");
            let mut status = RecordingStatus::default();
            let mut cache = FakeCache::fresh(Some(failure));
            assert!(run_install(&mut status, |status| {
                install_cache(
                    status,
                    &mut cache,
                    &paths,
                    "https://example.test/asset",
                    true,
                )
            })
            .is_err());
            assert!(matches!(status.0.last(), Some(InstallStatus::Failed(_))));
        }
    }
}
