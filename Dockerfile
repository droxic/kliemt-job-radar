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

COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

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