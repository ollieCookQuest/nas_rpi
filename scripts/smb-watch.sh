#!/bin/sh

# SMB Watch Script  
# This script watches for changes in the SMB config and reloads Samba

SMB_CONFIG="/shared/smb/shares.conf"
CONTAINER_CONFIG="/etc/samba/shares.conf"

echo "SMB Watch: Monitoring config file at $SMB_CONFIG..."

# Ensure samba directory exists
mkdir -p /etc/samba

# Initial load if file exists
if [ -f "$SMB_CONFIG" ]; then
  cp "$SMB_CONFIG" "$CONTAINER_CONFIG"
  smbcontrol all reload-config 2>/dev/null || true
  echo "Samba config initially loaded"
fi

while true; do
  if [ -f "$SMB_CONFIG" ]; then
    # Copy the file to the correct location
    cp "$SMB_CONFIG" "$CONTAINER_CONFIG"
    smbcontrol all reload-config 2>/dev/null || true
    echo "Samba config reloaded at $(date)"
  fi
  sleep 5
done

