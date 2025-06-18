FROM node:22-alpine
WORKDIR /app
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY . .
RUN npm ci --legacy-peer-deps
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
