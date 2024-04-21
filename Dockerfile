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

ENV NODE_ENV production

USER node
WORKDIR /home/node

EXPOSE 3000

COPY --from=builder --chown=node:node /home/node/ ./

CMD ["npm", "run", "start:production"]