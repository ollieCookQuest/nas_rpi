#!/bin/sh

# NFS Watch Script
# This script watches for changes in the exports file and reloads NFS

EXPORTS_FILE="/shared/nfs/shares.exports"
CONTAINER_EXPORTS="/etc/exports.d/shares.exports"

echo "NFS Watch: Monitoring exports file at $EXPORTS_FILE..."

# Ensure exports.d directory exists
mkdir -p /etc/exports.d

# Initial load if file exists
if [ -f "$EXPORTS_FILE" ]; then
  cp "$EXPORTS_FILE" "$CONTAINER_EXPORTS"
  exportfs -ra 2>/dev/null || true
  echo "NFS exports initially loaded"
fi

while true; do
  if [ -f "$EXPORTS_FILE" ]; then
    # Copy the file to the correct location
    cp "$EXPORTS_FILE" "$CONTAINER_EXPORTS"
    exportfs -ra 2>/dev/null || true
    echo "NFS exports reloaded at $(date)"
  fi
  sleep 5
done

