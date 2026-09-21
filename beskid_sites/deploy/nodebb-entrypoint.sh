#!/bin/sh
set -eu

config_dir="${CONFIG_DIR:-/opt/config}"
config_path="${config_dir}/config.json"
setup_marker="${config_dir}/.setup-complete"

mkdir -p "${config_dir}"

if [ ! -f "${config_path}" ]; then
  : "${NODEBB_URL:?set NODEBB_URL}"
  : "${NODEBB_SESSION_SECRET:?set NODEBB_SESSION_SECRET}"
  : "${NODEBB_DB_HOST:?set NODEBB_DB_HOST}"
  : "${NODEBB_DB_NAME:?set NODEBB_DB_NAME}"
  : "${NODEBB_DB_USER:?set NODEBB_DB_USER}"
  : "${NODEBB_DB_PASSWORD:?set NODEBB_DB_PASSWORD}"

  NODEBB_CONFIG_PATH="${config_path}" \
  node - <<'NODE'
const fs = require("node:fs");

const value = (name) => {
  const result = process.env[name];
  if (!result) {
    throw new Error(`missing ${name}`);
  }
  return result;
};

const config = {
  url: value("NODEBB_URL"),
  secret: value("NODEBB_SESSION_SECRET"),
  database: "postgres",
  postgres: {
    host: value("NODEBB_DB_HOST"),
    port: Number(process.env.NODEBB_DB_PORT || 5432),
    database: value("NODEBB_DB_NAME"),
    username: value("NODEBB_DB_USER"),
    password: value("NODEBB_DB_PASSWORD"),
  },
  port: Number(process.env.NODEBB_PORT || 4567),
  bind_address: "0.0.0.0",
  trust_proxy: true,
};

fs.writeFileSync(process.env.NODEBB_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, {
  mode: 0o600,
});
NODE
fi

if [ ! -f "${setup_marker}" ]; then
  : "${NODEBB_ADMIN_USERNAME:?set NODEBB_ADMIN_USERNAME}"
  : "${NODEBB_ADMIN_PASSWORD:?set NODEBB_ADMIN_PASSWORD}"
  : "${NODEBB_ADMIN_EMAIL:?set NODEBB_ADMIN_EMAIL}"
  export SETUP=true
  /usr/src/app/install/docker/entrypoint.sh
  touch "${setup_marker}"
fi

exec /usr/src/app/install/docker/entrypoint.sh
