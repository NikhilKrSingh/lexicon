### STAGE 1: Build ###
FROM node:13.2.0-alpine3.10 AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM nginx:1.17.6-alpine
COPY --from=build /usr/src/app/dist/Quarto-Frontend /usr/share/nginx/html