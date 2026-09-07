# Beskid production deployment

This directory is the sole Beskid production runtime for `beskid-lang.org`. It uses
Docker Compose, the shared host edge network, the private registry at `cr.beskid-lang.org`, and
Watchtower. There is no staging deployment and no deployment control plane.

## Release flow

1. A successful `main` delivery run builds each application image.
2. CI pushes `sha-<commit>` (immutable audit) and `production` (controlled
   release) tags to `cr.beskid-lang.org/beskid/<service>`.
3. Watchtower polls every minute and restarts only services labelled
   `com.centurylinklabs.watchtower.enable=true`.
4. CI waits through the Watchtower window and smokes the canonical production
   endpoints.

The tagged application services are `website`, `auth`, `learn`, `tracker`,
`nexus`, and `pckg`. The shared edge, registry, Watchtower, Postgres, Authelia, and
community are pinned infrastructure: change them only with an audited Compose
deployment.

## Host bootstrap

The production host is `root@bdziam.dev`; the runtime directory defaults to
`/opt/beskid`. Before the first apply, an operator must provide:

- DNS for `beskid-lang.org`, `auth`, `login`, `learn`, `tracker`, `nexus`,
  `pckg`, `community`, and `cr` subdomains.
- A registry account with pull access on the host and push access stored in the
  repository secrets `REGISTRY_USERNAME` and `REGISTRY_PASSWORD`.
- A bcrypt registry credential file at `registry/htpasswd`.
- OpenBao production secrets, or a populated local `.env` copied from
  `.env.example`. Do not commit `.env`, `htpasswd`, or Watchtower’s Docker
  credential file. The template explicitly lists the Authelia storage, signing,
  and per-client OIDC secrets; replace every placeholder with a production
  value before applying.
- `BESKID_EDGE_NETWORK`, the existing host network used by the shared Caddy
  Docker proxy. Beskid joins this network but does not own its ports or proxy.

Apply the runtime definition:

```bash
cd beskid_sites/deploy
./deploy.sh --from-openbao
```

`deploy.sh` copies the Compose files, writes `/opt/beskid/.env`, logs the host
into the registry using stdin, creates Watchtower’s private Docker credential
file, starts the stack, and runs public smoke checks. The script rejects any
application tag other than `production`.

The first cutover adopts the host's existing `beskid-registry-data` Docker
volume. It is external to Compose so existing registry images and rollback tags
are retained; do not delete or recreate that volume during the switch.

## Registry authentication

The shared edge terminates TLS only. `registry:2.8` performs its own htpasswd challenge,
so CI, operators, Docker, and Watchtower observe identical authentication.
Generate or rotate the host credential outside Git:

```bash
htpasswd -Bbn <registry-user> <registry-password> > registry/htpasswd
```

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
