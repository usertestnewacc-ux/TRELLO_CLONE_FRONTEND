FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./

RUN npm install
COPY . ./
RUN npm run build

FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/TRELLI_UI/browser /usr/share/nginx/html

EXPOSE 80