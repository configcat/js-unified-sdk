FROM node:22.20.0-trixie-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8088

CMD [ "node", "index.js" ]
