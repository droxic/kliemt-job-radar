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

    # Handle SPA routing - only for HTML requests
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]