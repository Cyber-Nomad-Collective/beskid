# Isolated platform worker

`beskid-platform` is the optional rootless-Docker worker for platform images.
It runs as `woodpecker-platform` using `/run/user/1001/docker.sock`; never mount
the host Docker socket. The agent is a systemd service capped at one workflow,
3 GiB, and two CPU cores.

Steps receive only their rootless socket and durable output directory. They do
not receive production Compose, Watchtower, release evidence, or registry
credentials by default. A separately approved manual platform job may bind a
narrow registry credential when publication is intended.
