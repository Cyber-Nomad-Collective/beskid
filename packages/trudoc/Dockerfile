# Doc verification image (CI-style). Build from monorepo root:
#   docker build -f packages/trudoc/Dockerfile -t trudoc-verify .
#
# Run (mount or bake repo as needed):
#   docker run --rm -v "$PWD:/repo" -w /repo trudoc-verify
#
FROM oven/bun:1.2-alpine

WORKDIR /repo

# Workspace manifests (expand COPY if the site picks up additional workspace packages).
COPY package.json bun.lock ./
COPY packages/trudoc/package.json packages/trudoc/
COPY packages/beskid-docs-ui/package.json packages/beskid-docs-ui/
COPY site/website/package.json site/website/

RUN bun install --frozen-lockfile

# Application sources required for validators and layout scan.
COPY packages/trudoc packages/trudoc
COPY packages/beskid-docs-ui packages/beskid-docs-ui
COPY site/website site/website

ENV BESKID_WEBSITE_ROOT=/repo/site/website

CMD ["bun", "--cwd", "site/website", "run", "verify:trudoc", "--preset", "ci"]
