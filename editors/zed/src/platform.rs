#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum Os {
    Linux,
    Mac,
    Windows,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) enum Arch {
    X86_64,
    Aarch64,
    Other,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub(crate) struct PlatformAsset {
    pub(crate) asset_name: &'static str,
    pub(crate) binary_name: &'static str,
    pub(crate) executable: bool,
}

pub(crate) fn platform_asset(os: Os, arch: Arch) -> Result<PlatformAsset, String> {
    match (os, arch) {
        (Os::Linux, Arch::X86_64) => Ok(PlatformAsset {
            asset_name: "beskid_lsp-linux-amd64",
            binary_name: "beskid_lsp",
            executable: true,
        }),
        (Os::Mac, Arch::Aarch64) => Ok(PlatformAsset {
            asset_name: "beskid_lsp-darwin-arm64",
            binary_name: "beskid_lsp",
            executable: true,
        }),
        (Os::Windows, Arch::X86_64) => Ok(PlatformAsset {
            asset_name: "beskid_lsp-windows-amd64.exe",
            binary_name: "beskid_lsp.exe",
            executable: false,
        }),
        _ => Err(format!(
            "unsupported platform for Beskid LSP binary: os={os:?}, arch={arch:?}"
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::{platform_asset, Arch, Os};

    #[test]
    fn maps_published_release_assets() {
        assert_eq!(
            platform_asset(Os::Linux, Arch::X86_64).unwrap().asset_name,
            "beskid_lsp-linux-amd64"
        );
        assert_eq!(
            platform_asset(Os::Mac, Arch::Aarch64).unwrap().asset_name,
            "beskid_lsp-darwin-arm64"
        );
        assert_eq!(
            platform_asset(Os::Windows, Arch::X86_64)
                .unwrap()
                .binary_name,
            "beskid_lsp.exe"
        );
    }

    #[test]
    fn rejects_unpublished_release_asset() {
        assert!(platform_asset(Os::Linux, Arch::Aarch64)
            .unwrap_err()
            .contains("unsupported platform"));
    }
}
