FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY entrypoint.sh /docker-entrypoint.d/99-inject-url.sh
RUN dos2unix /docker-entrypoint.d/99-inject-url.sh && chmod +x /docker-entrypoint.d/99-inject-url.sh
EXPOSE 80
