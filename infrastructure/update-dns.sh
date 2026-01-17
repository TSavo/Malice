#!/bin/bash
# Update Cloudflare DNS records to new droplet IP
# Run: ./update-dns.sh <new-ip>

set -e

if [ -z "$1" ]; then
    echo "Usage: ./update-dns.sh <new-droplet-ip>"
    echo "Example: ./update-dns.sh 146.190.xxx.xxx"
    exit 1
fi

NEW_IP="$1"
CF_TOKEN="${CLOUDFLARE_API_TOKEN:-}"

if [ -z "$CF_TOKEN" ]; then
    echo "Error: CLOUDFLARE_API_TOKEN not set"
    echo "Export it or add to ~/.bashrc"
    exit 1
fi

echo "🔄 Updating DNS records to: $NEW_IP"

# Zone IDs
GRAYCARTEL="f27a4e36ea115507b83ba086516971c0"
MALICE="60737199fe071b45bb80e77b2fb9329d"
CONTINUUM="055a5e9131aa7892be57c67a6a99fe8d"

update_record() {
    local zone_id=$1
    local record_name=$2
    local zone_name=$3
    
    # Get record ID
    record_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?name=$record_name" \
        -H "Authorization: Bearer $CF_TOKEN" | jq -r '.result[0].id')
    
    if [ "$record_id" != "null" ] && [ -n "$record_id" ]; then
        # Update record
        curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$record_id" \
            -H "Authorization: Bearer $CF_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"content\":\"$NEW_IP\"}" | jq -r '.success'
        echo "  ✅ $record_name"
    else
        echo "  ⚠️  $record_name not found"
    fi
}

echo ""
echo "=== graycartel.com ==="
update_record "$GRAYCARTEL" "graycartel.com" "graycartel.com"
update_record "$GRAYCARTEL" "*.graycartel.com" "graycartel.com"

echo ""
echo "=== malice.world ==="
update_record "$MALICE" "malice.world" "malice.world"
update_record "$MALICE" "www.malice.world" "malice.world"

echo ""
echo "=== thecontinuum.city ==="
update_record "$CONTINUUM" "thecontinuum.city" "thecontinuum.city"
update_record "$CONTINUUM" "*.thecontinuum.city" "thecontinuum.city"

echo ""
echo "✅ DNS update complete!"
echo "📝 Note: Changes may take a few minutes to propagate"
