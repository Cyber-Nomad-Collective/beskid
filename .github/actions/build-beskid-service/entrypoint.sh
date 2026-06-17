#!/usr/bin/env sh
set -e

# Default arguments – can be overridden by the caller
SERVICE_NAME="${INPUT_SERVICE_NAME:-unknown}"
CONTEXT="${INPUT_DOCKER_CONTEXT:-}"
EXTRA_ARGS="${INPUT_EXTRA_BUILD_ARGS:-}"
PUSH_IMAGE="${INPUT_PUSH_IMAGE:-false}"
TAGS="${INPUT_TAGS:-latest}"

echo "Building service: $SERVICE_NAME"
echo "Context: $CONTEXT"
echo "Tags: $TAGS"

# Run the actual Docker build
docker build \
  $EXTRA_ARGS \
  -t "$SERVICE_NAME:$TAGS" \
  "$CONTEXT"

# Push if requested
if [ "$PUSH_IMAGE" = "true" ]; then
  echo "Pushing $SERVICE_NAME:$TAGS"
  docker push "$SERVICE_NAME:$TAGS"
fi

# Emit SBOM (Syft) as an artifact
syft packages -o json > sbom.json

echo "SBOM generated: sbom.json"
