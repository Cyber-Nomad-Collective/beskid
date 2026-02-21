pub mod cli;
pub mod commands;
pub mod errors;

fn main() -> anyhow::Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    cli::run()
}
