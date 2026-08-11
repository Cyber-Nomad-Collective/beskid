use std::path::Path;

use zed_extension_api as zed;

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
        _worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        if language_server_id.as_ref() != BESKID_LANGUAGE_SERVER_ID {
            return Err(format!(
                "unsupported language server: {}",
                language_server_id
            ));
        }

        let (asset_name, binary_name) = language_server_binary_asset()?;

        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::CheckingForUpdate,
        );

        let command = match beskid_lsp_binary_path(&asset_name, &binary_name, language_server_id) {
            Ok(path) => path,
            Err(err) => {
                zed::set_language_server_installation_status(
                    language_server_id,
                    &zed::LanguageServerInstallationStatus::Failed(err.clone()),
                );
                return Err(err);
            }
        };

        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::None,
        );

        Ok(zed::Command::new(command).arg("--stdio"))
    }
}

fn language_server_binary_asset() -> zed::Result<(String, String)> {
    let (os, arch) = zed::current_platform();
    let (asset_name, binary_name) = match (os, arch) {
        (zed::Os::Linux, zed::Architecture::X86_64) => {
            ("beskid_lsp-linux-amd64".to_string(), "beskid_lsp".to_string())
        }
        (zed::Os::Mac, zed::Architecture::Aarch64) => {
            ("beskid_lsp-darwin-arm64".to_string(), "beskid_lsp".to_string())
        }
        (zed::Os::Windows, zed::Architecture::X86_64) => (
            "beskid_lsp-windows-amd64.exe".to_string(),
            "beskid_lsp.exe".to_string(),
        ),
        _ => {
            return Err(format!(
                "unsupported platform for Beskid LSP binary: os={:?}, arch={:?}",
                os, arch
            ))
        }
    };

    Ok((asset_name, binary_name))
}

fn beskid_lsp_binary_path(
    asset_name: &str,
    binary_name: &str,
    language_server_id: &zed::LanguageServerId,
) -> zed::Result<String> {
    let release = zed::github_release_by_tag_name(BESKID_REPO, BESKID_RELEASE_TAG)?;

    let download_url = release
        .assets
        .iter()
        .find(|asset| asset.name == asset_name)
        .map(|asset| asset.download_url.to_string())
        .ok_or_else(|| {
            format!(
                "missing {asset_name} asset in {} release {}",
                BESKID_REPO, BESKID_RELEASE_TAG
            )
        })?;

    let target_path = format!("./{}-{}", binary_name, release.version);
    let target_path = target_path.as_str();

    if !Path::new(target_path).exists() {
        zed::set_language_server_installation_status(
            language_server_id,
            &zed::LanguageServerInstallationStatus::Downloading,
        );

        zed::download_file(&download_url, target_path, zed::DownloadedFileType::Uncompressed)?;

        if asset_name != "beskid_lsp-windows-amd64.exe" {
            zed::make_file_executable(target_path)?;
        }
    }

    Ok(target_path.to_string())
}

zed::register_extension!(BeskidExtension);
