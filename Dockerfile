FROM node:20-alpine as builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

COPY package*.json ./

COPY --chown=node:node . .
RUN npm i \
    && npm run build

# ---

FROM node:20-alpine

# Install DNS tools for debugging (optional but helpful)
USER root
RUN apk update && \
    apk add --no-cache bind-tools iputils && \
    rm -rf /var/cache/apk/*

# Fix DNS resolution inside container (safe - only affects this container)
RUN echo "nameserver 8.8.8.8" > /tmp/resolv.conf.custom && \
    echo "nameserver 8.8.4.4" >> /tmp/resolv.conf.custom && \
    echo "nameserver 1.1.1.1" >> /tmp/resolv.conf.custom

ENV NODE_ENV production
# Configure DNS at runtime (fallback if Docker DNS not configured)
# Force IPv4 first for Node DNS resolution
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

USER node
WORKDIR /home/node

EXPOSE 3000

COPY --from=builder --chown=node:node /home/node/ ./

# Set the command to run the application with DNS override
CMD ["sh", "-c", "cat /tmp/resolv.conf.custom > /etc/resolv.conf 2>/dev/null || true && npm run start:production"]