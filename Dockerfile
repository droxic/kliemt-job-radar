# Stage 1: Build the Vue app
FROM node:22-alpine AS build

WORKDIR /app

# Install Yarn
RUN apk add --no-cache yarn

# Copy dependency manifests
COPY package.json yarn.lock ./

# Use Yarn (frozen-lockfile = reproducible builds)
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build with Yarn
RUN yarn build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./client /usr/share/nginx/html/client

COPY <<'JSEOF' /usr/share/nginx/html/stale-asset.js
// Served in place of a 404 for a missing content-hashed bundle, which means
// this browser is running an index.html cached from before a deploy. It cannot
// recover by itself: the missing file is the entry script, so no application
// code ever runs. Reloading past the cached copy fixes it permanently, because
// the fresh index.html is sent with Cache-Control: no-cache.
(function () {
  var marker = '__stale'
  if (location.search.indexOf(marker) !== -1) {
    console.error('Stale bundle recovery already attempted for this page.')
    return
  }
  var sep = location.search ? '&' : '?'
  location.replace(
    location.pathname + location.search + sep + marker + '=' + Date.now() + location.hash
  )
})()
JSEOF

COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # A content-hashed bundle that is missing means the browser is running an
    # index.html cached from before a deploy. It cannot recover on its own:
    # the missing file is the entry script, so no application code ever runs
    # and the page just stays blank. Serve a recovery script instead of a 404.
    # Must precede the generic asset rule below - nginx tries regex locations
    # in the order they are defined.
    location ~* ^/assets/.+\.js\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri @stale_asset;
    }

    location @stale_asset {
        default_type application/javascript;
        add_header Cache-Control "no-store";
        add_header X-Content-Type-Options nosniff;
        try_files /stale-asset.js =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    # index.html names the content-hashed bundles above, so it must never be
    # served stale: a cached copy keeps pointing at the previous build and the
    # user sees the old app until they hard-refresh. With no Cache-Control at
    # all, browsers fall back to heuristic freshness (roughly a tenth of the
    # file's age), which is how a deploy could go unnoticed for days.
    # no-cache still allows a cheap 304 via ETag; it only forbids using the
    # copy without revalidating.
    location = /index.html {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Handle SPA routing - only for HTML requests
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]