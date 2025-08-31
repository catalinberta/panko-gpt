#!/bin/sh

cat <<EOF > /usr/src/app/frontend/public/env-config.js
window.__ENV__ = {
  API_URL: "$API_URL"
}
EOF

exec "$@"

