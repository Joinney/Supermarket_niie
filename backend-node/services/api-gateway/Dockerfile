FROM node:20-alpine

# Các dòng dưới giữ nguyên
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]