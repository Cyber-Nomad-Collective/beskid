pub mod extractor;
pub mod generator;
pub mod model;
pub mod validation;

pub use model::{InteropDecl, InteropParam, ReturnGroup};

use anyhow::Result;
use std::path::PathBuf;

use crate::validation::{AstContractValidator, InteropContractValidator};

pub struct ToolingArgs {
    pub spec_root: PathBuf,
    pub output_dir: PathBuf,
    pub prelude_output: PathBuf,
    pub runtime_output: PathBuf,
    pub check: bool,
    pub dry_run: bool,
}

pub fn execute(args: ToolingArgs) -> Result<()> {
    let spec_files = extractor::collect_spec_files(&args.spec_root)?;
    let mut decls = Vec::new();
    for path in spec_files {
        decls.extend(extractor::parse_spec_file(&path)?);
    }

    if decls.is_empty() {
        anyhow::bail!(
            "no #[InteropCall(...)] declarations found under `{}`",
            args.spec_root.display()
        );
    }

    decls.sort();
    let validator = AstContractValidator;
    validator.validate_declarations(&decls)?;

    let enum_source = generator::generate_stdinterop_source(&decls);
    let calls_source = generator::generate_calls_source(&decls);
    let prelude_source = generator::generate_prelude_source(&decls);
    let runtime_source = generator::generate_runtime_source(&decls);

    let enum_path = args.output_dir.join("StdInterop.generated.bd");
    let calls_path = args.output_dir.join("Calls.generated.bd");
    let prelude_path = args.prelude_output;
    let runtime_path = args.runtime_output;

    if args.dry_run {
        println!("Would generate:");
        println!("  {}", enum_path.display());
        println!("  {}", calls_path.display());
        println!("  {}", prelude_path.display());
        println!("  {}", runtime_path.display());
        return Ok(());
    }

    if args.check {
        generator::check_generated_file(&enum_path, &enum_source)?;
        generator::check_generated_file(&calls_path, &calls_source)?;
        generator::check_generated_file(&prelude_path, &prelude_source)?;
        generator::check_generated_file(&runtime_path, &runtime_source)?;
        println!("Interop generated files are up to date.");
        return Ok(());
    }

    std::fs::create_dir_all(&args.output_dir)?;
    if let Some(parent) = prelude_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    if let Some(parent) = runtime_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    generator::write_if_changed(&enum_path, &enum_source)?;
    generator::write_if_changed(&calls_path, &calls_source)?;
    generator::write_if_changed(&prelude_path, &prelude_source)?;
    generator::write_if_changed(&runtime_path, &runtime_source)?;

    println!("Generated interop source files:");
    println!("  {}", enum_path.display());
    println!("  {}", calls_path.display());
    println!("  {}", prelude_path.display());
    println!("  {}", runtime_path.display());
    Ok(())
}
