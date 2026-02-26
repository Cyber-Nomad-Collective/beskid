use anyhow::{Context, Result};
use clap::Args;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Args, Debug)]
pub struct StdlibArgs {
    /// Destination directory for the Beskid stdlib project
    #[arg(long, default_value = "standard_library")]
    pub output: PathBuf,
}

pub fn execute(args: StdlibArgs) -> Result<()> {
    generate_stdlib_project(&args.output)
}

fn generate_stdlib_project(output: &Path) -> Result<()> {
    let template_root = stdlib_template_root();
    validate_template_layout(&template_root)?;

    if is_same_location(&template_root, output) {
        println!(
            "Using checked-in Beskid stdlib project at {}",
            template_root.display()
        );
        return Ok(());
    }

    copy_dir_recursive(&template_root, output)?;

    println!(
        "Generated Beskid stdlib project at {}",
        output.canonicalize().unwrap_or_else(|_| output.to_path_buf()).display()
    );
    Ok(())
}

fn stdlib_template_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../standard_library")
}

fn validate_template_layout(template_root: &Path) -> Result<()> {
    let manifest = template_root.join("Project.proj");
    let prelude = template_root.join("Src/Prelude.bd");

    if !manifest.is_file() {
        anyhow::bail!("missing stdlib manifest template at `{}`", manifest.display());
    }
    if !prelude.is_file() {
        anyhow::bail!("missing stdlib prelude template at `{}`", prelude.display());
    }
    Ok(())
}

fn is_same_location(left: &Path, right: &Path) -> bool {
    match (left.canonicalize(), right.canonicalize()) {
        (Ok(l), Ok(r)) => l == r,
        _ => false,
    }
}

fn copy_dir_recursive(source: &Path, destination: &Path) -> Result<()> {
    fs::create_dir_all(destination)
        .with_context(|| format!("create directory `{}`", destination.display()))?;

    for entry in fs::read_dir(source)
        .with_context(|| format!("read template directory `{}`", source.display()))?
    {
        let entry = entry
            .with_context(|| format!("read entry under `{}`", source.display()))?;
        let source_path = entry.path();
        let destination_path = destination.join(entry.file_name());

        if source_path.is_dir() {
            copy_dir_recursive(&source_path, &destination_path)?;
        } else {
            fs::copy(&source_path, &destination_path).with_context(|| {
                format!(
                    "copy `{}` to `{}`",
                    source_path.display(),
                    destination_path.display()
                )
            })?;
        }
    }

    Ok(())
}
