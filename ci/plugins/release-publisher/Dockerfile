# Beskid release publisher: the Woodpecker plugin image that alone receives the
# publication secrets (compiler_release_token, pckg_release_publisher_key,
# open_vsx_token). Woodpecker gives an image-filtered secret only to a plugin
# step (no commands, entrypoint or environment), so the publication steps run
# this image with `settings:` and the dispatcher maps them onto the reviewed
# scripts of the checked-out repository in $CI_WORKSPACE. The image carries
# tools and the dispatcher only; publication logic stays in the repository.
#
# Build context: ci/plugins/release-publisher. Build and push it with the
# manual BESKID_TASK=publisher-image task in .woodpecker/platform.yml.
FROM node:22.16.0-bookworm@sha256:71bcbb3b215b3fa84b5b167585675072f4c270855e37a599803f1a58141a0716

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates clang gh git jq openssh-client python3 unzip \
 && rm -rf /var/lib/apt/lists/*

COPY dispatch.sh /usr/local/bin/beskid-release-publisher
RUN chmod 0755 /usr/local/bin/beskid-release-publisher

ENTRYPOINT ["/usr/local/bin/beskid-release-publisher"]
