# Beskid production deployment

This directory is the sole Beskid production runtime for `beskid-lang.org`. It uses
Docker Compose, Authentik, the shared host edge network, the registry at
`cr.beskid-lang.org`, and Watchtower. There is no staging deployment and no
deployment control plane.

## Release flow

1. AppVeyor admits one project job at a time (`max_jobs: 1`), so its FIFO queue
   serializes builds and prevents an older build from promoting after a newer
   one. The Linux, macOS, and Windows compiler jobs remain separate required
   members of `compiler-validation` and complete one at a time before the
   `main` platform lane can run.
2. The platform lane completes its gates, pushes all five
   `sha-<commit>` immutable images, and retains exactly five registry-digest
   records in its build artifact.
3. CI publishes the live package release. Only a successful package result
   permits it to pull those immutable images and advance their matching
   `production` tags; promotion never rebuilds images.
4. Watchtower polls every minute and restarts only services labelled
   `com.centurylinklabs.watchtower.enable=true`.
5. Operators observe Watchtower status and smoke the canonical production
   endpoints independently of CI.

Only a new trusted `main` push has mutation authority. Pull requests, tags,
manual/API and scheduled builds, rebuilds, and incomplete-job reruns do not
publish images, packages, or production tags. CI has no Compose, production
host, or Watchtower-control credential and must not be used to force rollout,
rollback, or a health check.

The five registry repositories have no cross-repository atomic promotion.
Watchtower can therefore observe a mixed set during tag movement; the five
digest-backed immutable records prove the intended common source SHA, and
operator checks establish eventual convergence. AppVeyor artifacts are evidence
only, not the durable image store.

The tagged application services are `website`, `learn`, `tracker`, `nexus`,
and `pckg`. The shared edge, registry, Watchtower, and Postgres are
pinned infrastructure: change them only with an audited Compose
deployment.

## Host bootstrap

The production host is `root@bdziam.dev`; the runtime directory defaults to
`/opt/beskid`. Before the first apply, an operator must provide:

- DNS for `beskid-lang.org`, `auth`, `learn`, `tracker`, `nexus`, `pckg`, and
  `cr` subdomains.
- A registry account with pull access on the host and push access stored as
  secure AppVeyor variables `REGISTRY_USERNAME` and `REGISTRY_PASSWORD`.
- A bcrypt registry credential file at `registry/htpasswd`. This ignored file
  is copied to the host with mode `0600`; do not commit it.
- OpenBao production secrets, or a populated local `.env` copied from
  `.env.example`. Do not commit `.env`.
- Authentik secrets: `AUTHENTIK_POSTGRES_PASSWORD`, `AUTHENTIK_SECRET_KEY`,
  and a one-time `AUTHENTIK_BOOTSTRAP_TOKEN`. Store them in OpenBao or the
  host `.env`; never commit them.
- A GitHub OAuth application whose callback URL is
  `https://auth.beskid-lang.org/source/oauth/callback/github/`. Configure its
  client ID and secret in the host `.env` as `GITHUB_CLIENT_ID` and
  `GITHUB_CLIENT_SECRET`. Authentik is the only browser authentication path.
- `BESKID_EDGE_NETWORK`, the existing host network used by the shared Caddy
  Docker proxy. Beskid joins this network but does not own its ports or proxy.

Apply the runtime definition:

```bash
cd beskid_sites/deploy
./deploy.sh --from-openbao
```

`deploy.sh` copies the Compose files, writes `/opt/beskid/.env`, starts the
stack, reapplies the idempotent Authentik brand configuration, and runs public
smoke checks. The script rejects any
application tag other than `production`.

The Authentik login uses the Beskid logo and a real Beskid Żywiecki view from
Mała Racza. The photograph is by Pudelek and is used under CC BY 3.0; its
source and attribution are recorded in `authentik-branding.py` and the login
footer.

The first cutover adopts the host's existing `beskid-registry-data` Docker
volume. It is external to Compose so existing registry images and rollback tags
are retained; do not delete or recreate that volume during the switch.

## Registry authentication

The shared edge terminates TLS only. `registry:2.8` performs its own htpasswd
challenge, so CI, operators, Docker, and Watchtower observe identical
authentication. Generate or rotate the deployment credential outside Git:

```bash
htpasswd -Bbn <registry-user> <registry-password> > registry/htpasswd
```

Use the same username and password for the repository secrets
`REGISTRY_USERNAME` and `REGISTRY_PASSWORD`, then rerun `deploy.sh`. The script
fails closed if the credential file is missing or empty, copies it separately
from `.env`, restricts it to the host administrator, and restarts the registry
through Compose. Validate rotation with `docker login cr.beskid-lang.org`; an
unauthenticated `GET /v2/` must return `401 Unauthorized`.

## Rollback

The immutable `sha-<commit>` tags are the rollback record. Retag the known-good
SHA image as `production` in the private registry; Watchtower picks it up on
its next poll. Do not edit a running container or use a second deployment
path. Keep retained SHA tags until the corresponding release is no longer a
rollback candidate.

## AppVeyor activation proof

The checked-in pipeline is not proof of provider-account readiness.
Serialization deliberately increases the total build duration to preserve
release order. Before making it a required publishing check, an operator must
record a live proof that every hosted job, especially the complete platform
lane, finishes within AppVeyor's fixed 60-minute per-job limit; use a
private/BYOC worker if it does not. The operator must
also prove private nested submodules initialize at their pinned commits on
Linux, macOS, and Windows without granting a reusable credential to pull
request code. Until those proofs exist, publication activation remains blocked.

## Local validation

```bash
BESKID_ENV_FILE=.env.example docker compose --env-file .env.example -f docker-compose.yml config --quiet
bash ../../scripts/ci/test/production-watchtower-contract.test.sh
```
