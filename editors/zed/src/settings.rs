use crate::language_server::LaunchSettings;
use zed_extension_api as zed;

pub(crate) fn user_override(
    settings: zed::settings::LspSettings,
) -> zed::Result<Option<LaunchSettings>> {
    let Some(binary) = settings.binary else {
        return Ok(None);
    };
    let Some(path) = binary.path else {
        return Ok(None);
    };
    if path.trim().is_empty() {
        return Err("Beskid LSP binary.path must be a nonempty user-selected path".into());
    }

    let mut environment: Vec<_> = binary.env.unwrap_or_default().into_iter().collect();
    environment.sort_unstable();

    Ok(Some(LaunchSettings {
        path: Some(path),
        arguments: binary.arguments.unwrap_or_default(),
        environment,
    }))
}

pub(crate) fn forward_initialization_options(
    initialization_options: Option<zed::serde_json::Value>,
) -> Option<zed::serde_json::Value> {
    initialization_options
}

pub(crate) fn forward_workspace_configuration(
    settings: Option<zed::serde_json::Value>,
) -> Option<zed::serde_json::Value> {
    settings
}
