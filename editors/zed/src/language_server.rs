use crate::platform::PlatformAsset;

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) struct LaunchSettings {
    pub(crate) path: Option<String>,
    pub(crate) arguments: Vec<String>,
    pub(crate) environment: Vec<(String, String)>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum LaunchChoice {
    Override(LaunchSettings),
    LspOnPath(String),
    CliOnPath(String),
    Download,
}

pub(crate) fn select_launch(
    override_settings: Option<LaunchSettings>,
    lsp_path: Option<&str>,
    cli_path: Option<&str>,
) -> LaunchChoice {
    if let Some(override_settings) = override_settings {
        return LaunchChoice::Override(override_settings);
    }

    if let Some(lsp_path) = lsp_path {
        return LaunchChoice::LspOnPath(lsp_path.into());
    }

    if let Some(cli_path) = cli_path {
        return LaunchChoice::CliOnPath(cli_path.into());
    }

    LaunchChoice::Download
}

pub(crate) fn platform_for_download(
    launch_choice: &LaunchChoice,
    resolve_platform: impl FnOnce() -> Result<PlatformAsset, String>,
) -> Result<Option<PlatformAsset>, String> {
    match launch_choice {
        LaunchChoice::Download => resolve_platform().map(Some),
        LaunchChoice::Override(_) | LaunchChoice::LspOnPath(_) | LaunchChoice::CliOnPath(_) => {
            Ok(None)
        }
    }
}

impl LaunchChoice {
    pub(crate) fn command(&self) -> LaunchSettings {
        match self {
            Self::Override(settings) => settings.clone(),
            Self::LspOnPath(path) => LaunchSettings {
                path: Some(path.clone()),
                arguments: vec!["--stdio".into()],
                environment: Vec::new(),
            },
            Self::CliOnPath(path) => LaunchSettings {
                path: Some(path.clone()),
                arguments: vec!["lsp".into()],
                environment: Vec::new(),
            },
            Self::Download => LaunchSettings {
                path: None,
                arguments: vec!["--stdio".into()],
                environment: Vec::new(),
            },
        }
    }
}
