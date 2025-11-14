#!/bin/sh
# Entrypoint script to configure DNS and start the application

# Apply DNS configuration (requires root, but we run as root in entrypoint)
cat /tmp/resolv.conf.custom > /etc/resolv.conf 2>/dev/null || true

# Switch to node user and execute the command
exec su-exec node "$@"

