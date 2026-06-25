FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# 🎯 ÉP BUỘC DOCKER CÀI ĐẶT THƯ VIỆN CLIENT TRONG MÔI TRƯỜNG DOCKER
RUN npm install socket.io-client --save
RUN npm install

COPY . .

EXPOSE 5173

# Chạy thẳng dev server của Vite
CMD ["npm", "run", "dev"]