# Beskid production deployment

This directory is the sole Beskid production runtime for `beskid-lang.org`. It uses
Docker Compose, Authelia, the shared host edge network, the registry at
`cr.beskid-lang.org`, and Watchtower. There is no staging deployment and no
deployment control plane.

## Release flow

1. A successful `main` delivery run builds each application image.
2. CI pushes `sha-<commit>` (immutable audit) and `production` (controlled
   release) tags to `cr.beskid-lang.org/beskid/<service>`.
3. Watchtower polls every minute and restarts only services labelled
   `com.centurylinklabs.watchtower.enable=true`.
4. CI waits through the Watchtower window and smokes the canonical production
   endpoints.

The tagged application services are `website`, `learn`, `tracker`, `nexus`,
and `pckg`. The shared edge, registry, Watchtower, and Postgres are
pinned infrastructure: change them only with an audited Compose
deployment.

## Host bootstrap

The production host is `root@bdziam.dev`; the runtime directory defaults to
`/opt/beskid`. Before the first apply, an operator must provide:

- DNS for `beskid-lang.org`, `learn`, `tracker`, `nexus`, `pckg`,
`cr`, and `auth` subdomains.
- OpenBao production secrets, or a populated local `.env` copied from
  `.env.example`. Do not commit `.env`.
- An `authelia/users_database.yml` file copied from the example with an Argon2
  password hash for the administrator.

The Authelia portal uses the Beskid logo and Authelia’s supported dark theme.
The assets live in `authelia/assets/`; do not add custom portal CSS because
Authelia does not provide a stable CSS override API.
- `BESKID_EDGE_NETWORK`, the existing host network used by the shared Caddy
  Docker proxy. Beskid joins this network but does not own its ports or proxy.

Apply the runtime definition:

```bash
cd beskid_sites/deploy
./deploy.sh --from-openbao
```

`deploy.sh` copies the Compose files, writes `/opt/beskid/.env`, starts the
stack, and runs public smoke checks. The script rejects any
application tag other than `production`.

The first cutover adopts the host's existing `beskid-registry-data` Docker
volume. It is external to Compose so existing registry images and rollback tags
are retained; do not delete or recreate that volume during the switch.

## Registry access

The shared edge terminates TLS. The Beskid registry is intentionally
unauthenticated so CI and Watchtower can publish and pull without credentials.
Keep it exposed only through the intended host edge and do not treat it as a
general-purpose public image registry.

## Rollback

The immutable `sha-<commit>` tags are the rollback record. Retag the known-good
SHA image as `production` in the private registry; Watchtower picks it up on
its next poll. Do not edit a running container or use a second deployment
path. Keep retained SHA tags until the corresponding release is no longer a
rollback candidate.

## Local validation

```bash
env BESKID_ENV_FILE=.env.example docker compose -f docker-compose.yml config --quiet
bash ../../scripts/ci/test/production-watchtower-contract.test.sh
```
