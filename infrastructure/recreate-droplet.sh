#!/bin/bash
# Recreate malice-prod droplet
# Run: ./recreate-droplet.sh [--from-snapshot]

set -e

DROPLET_NAME="malice-prod"
REGION="sfo3"
SIZE="s-1vcpu-2gb"
IMAGE="ubuntu-25-10-x64"
SNAPSHOT_ID="212704420"
SSH_KEY_ID="52980537"
VPC_UUID="6e3d5277-38b8-4fcb-964b-2ae886141acb"

echo "🚀 Creating droplet: $DROPLET_NAME"

if [[ "$1" == "--from-snapshot" ]]; then
    echo "📸 Using snapshot: $SNAPSHOT_ID"
    doctl compute droplet create "$DROPLET_NAME" \
        --region "$REGION" \
        --size "$SIZE" \
        --image "$SNAPSHOT_ID" \
        --ssh-keys "$SSH_KEY_ID" \
        --vpc-uuid "$VPC_UUID" \
        --enable-monitoring \
        --enable-private-networking \
        --wait
else
    echo "🆕 Fresh install from: $IMAGE"
    doctl compute droplet create "$DROPLET_NAME" \
        --region "$REGION" \
        --size "$SIZE" \
        --image "$IMAGE" \
        --ssh-keys "$SSH_KEY_ID" \
        --vpc-uuid "$VPC_UUID" \
        --enable-monitoring \
        --enable-private-networking \
        --wait
fi

echo ""
echo "✅ Droplet created!"
doctl compute droplet list --format ID,Name,PublicIPv4,Status

echo ""
echo "📝 Next steps:"
echo "   1. Update DNS if needed"
echo "   2. SSH: ssh root@<new-ip>"
echo "   3. If fresh install, run setup scripts"
