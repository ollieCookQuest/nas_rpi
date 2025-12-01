#!/bin/sh

# NFS Server Setup Script
# This script configures NFS exports based on database configuration

echo "Starting NFS server setup..."

# Create exports directory if it doesn't exist
mkdir -p /etc/exports.d

# Generate exports file
cat > /etc/exports.d/shares.exports <<EOF
# NFS Exports - Auto-generated
# This file is managed by the NAS application
/data *(rw,sync,no_subtree_check,no_root_squash)
EOF

# Export all filesystems
exportfs -a

# Start rpcbind if not running
if ! pgrep -x rpcbind > /dev/null; then
    rpcbind
fi

# Start NFS server
rpc.statd
rpc.nfsd

# Show exports
exportfs -v

echo "NFS server setup complete"

# Keep container running
exec sh

