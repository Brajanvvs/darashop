FROM node:18-alpine AS build
WORKDIR /app

COPY server/package*.json server/
RUN cd server && npm install

COPY client/package*.json client/
RUN cd client && npm install

COPY server/ server/
COPY client/ client/
RUN cd client && npm run build

FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache tini

COPY --from=build /app/server /app/server
COPY --from=build /app/client/dist /app/client/dist

RUN mkdir -p /app/server/uploads

EXPOSE 3001

ENV NODE_ENV=production

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/index.js"]
