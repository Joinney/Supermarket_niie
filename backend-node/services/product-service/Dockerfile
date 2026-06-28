FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install socket.io

COPY . .

EXPOSE 5002

CMD ["node", "server.js"]