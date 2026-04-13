# Local reproducibility: Rust stable on Debian bookworm.
# Usage (from repo root): docker build -f ci/docker/rust-bookworm.Dockerfile -t pecan-ci-rust .
FROM rust:1-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
