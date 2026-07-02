FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install socket.io

COPY . .

EXPOSE 5007

CMD ["node", "server.js"]