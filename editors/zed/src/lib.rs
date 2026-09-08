use std::path::Path;

use language_server::{select_launch, LaunchChoice, LaunchSettings};
use platform::{platform_asset, Arch, Os, PlatformAsset};
use settings::{forward_initialization_options, forward_workspace_configuration, user_override};
use zed_extension_api as zed;

mod language_server;
mod platform;
mod settings;

const BESKID_REPO: &str = "Cyber-Nomad-Collective/beskid_compiler";
const BESKID_RELEASE_TAG: &str = "lsp-stable";
const BESKID_LANGUAGE_SERVER_ID: &str = "beskid-lsp";

struct BeskidExtension;

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

        let platform_asset = current_platform_asset()?;
        let settings =
            zed::settings::LspSettings::for_worktree(BESKID_LANGUAGE_SERVER_ID, worktree)?;
        let override_settings = user_override(settings)?;
        let lsp_path = worktree.which("beskid_lsp");
        let cli_path = worktree.which("beskid");

        let launch_settings =
            match select_launch(override_settings, lsp_path.as_deref(), cli_path.as_deref()) {
                LaunchChoice::Download => {
                    zed::set_language_server_installation_status(
                        language_server_id,
                        &zed::LanguageServerInstallationStatus::CheckingForUpdate,
                    );
                    let path = download_beskid_lsp(platform_asset, language_server_id)?;
                    zed::set_language_server_installation_status(
                        language_server_id,
                        &zed::LanguageServerInstallationStatus::None,
                    );
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
    let release = zed::github_release_by_tag_name(BESKID_REPO, BESKID_RELEASE_TAG)?;
    let download_url = release_asset_url(&release, platform_asset)?;
    let target_path = format!("./{}-{}", platform_asset.binary_name, release.version);

    if !Path::new(&target_path).exists() {
        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::Downloading,
        );
        zed::download_file(
            &download_url,
            &target_path,
            zed::DownloadedFileType::Uncompressed,
        )?;
        if platform_asset.executable {
            zed::make_file_executable(&target_path)?;
        }
    }

    Ok(target_path)
}

fn release_asset_url(
    release: &zed::GithubRelease,
    platform_asset: PlatformAsset,
) -> zed::Result<String> {
    release
        .assets
        .iter()
        .find(|asset| asset.name == platform_asset.asset_name)
        .map(|asset| asset.download_url.to_string())
        .ok_or_else(|| {
            format!(
                "missing {} asset in {} release {}",
                platform_asset.asset_name, BESKID_REPO, BESKID_RELEASE_TAG
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
    use crate::language_server::{select_launch, LaunchChoice, LaunchSettings};

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
                arguments: vec!["lsp".into()],
                environment: Vec::new(),
            }
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
