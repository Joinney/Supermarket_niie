FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Chạy thẳng dev server của Vite
CMD ["npm", "run", "dev"]