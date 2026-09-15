#!/usr/bin/env bash
# Run as root after review. Installs restricted SFTP accounts/config; never reloads sshd.
set -euo pipefail
[[ ${EUID} == 0 ]] || { echo 'run as root' >&2; exit 1; }
base=/var/lib/woodpecker-handoff; config=/etc/ssh/sshd_config.d/beskid-handoff.conf; keys=/etc/ssh/authorized_keys
for path in "$base" "$keys" "$config"; do [[ ! -L "$path" ]] || { echo "symlink path rejected: $path" >&2; exit 1; }; done
[[ ! -e "$base" || -d "$base" ]] || { echo "$base is not a directory" >&2; exit 1; }
[[ ! -e "$keys" || -d "$keys" ]] || { echo "$keys is not a directory" >&2; exit 1; }
for role in linux macos windows; do
  user="beskid-${role}"
  [[ ! -L "$base/$role" && ! -L "$keys/$user" ]] || { echo "symlink path rejected for $user" >&2; exit 1; }
  if id "$user" >/dev/null 2>&1; then
    [[ "$(getent passwd "$user" | cut -d: -f6,7)" == '/nonexistent:/usr/sbin/nologin' ]] || { echo "unexpected existing account $user" >&2; exit 1; }
  fi
  [[ ! -e "$base/$role" || -d "$base/$role" ]] || { echo "unexpected path $base/$role" >&2; exit 1; }
  [[ ! -e "$keys/$user" || -f "$keys/$user" ]] || { echo "unexpected key path $keys/$user" >&2; exit 1; }
done
install -d -m 0755 "$base"; install -d -m 0755 "$keys"; tmp="$(mktemp)"; backup="${config}.bak.$(date +%s)"; had_config=false
cleanup() { rm -f "$tmp"; }
trap cleanup EXIT
for role in linux macos windows; do
  user="beskid-${role}"; id "$user" >/dev/null 2>&1 || useradd --system --home-dir /nonexistent --shell /usr/sbin/nologin "$user"
  install -d -o root -g root -m 0755 "$base/$role"; install -d -o "$user" -g "$user" -m 0700 "$base/$role/incoming"
  [[ -e "$keys/$user" ]] || install -m 0644 -o root -g root /dev/null "$keys/$user"
  chown root:root "$keys/$user"; chmod 0644 "$keys/$user"
  cat >>"$tmp" <<EOF
Match User $user
  ChrootDirectory $base/$role
  ForceCommand internal-sftp -d /incoming
  AuthorizedKeysFile $keys/$user
  AuthenticationMethods publickey
  PasswordAuthentication no
  KbdInteractiveAuthentication no
  AllowTcpForwarding no
  DisableForwarding yes
  X11Forwarding no
  PermitTTY no
  PermitTunnel no

EOF
done
printf 'Match all\n' >>"$tmp"
[[ ! -e "$config" ]] || { cp -p "$config" "$backup"; had_config=true; }
install -m 0644 -o root -g root "$tmp" "$config"
if ! sshd -t; then
  if [[ "$had_config" == true ]]; then mv "$backup" "$config"; else rm -f "$config"; fi
  echo 'sshd validation failed; generated configuration rolled back' >&2
  exit 1
fi
[[ "$had_config" == true ]] && echo "Retained prior configuration backup: $backup"
echo "Installed $config and role key files; review then reload sshd separately."
