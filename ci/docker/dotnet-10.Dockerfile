# Local reproducibility: .NET 10 SDK (adjust tag when pinning).
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
