FROM node:latest

WORKDIR /app

COPY . .

RUN apt update
RUN apt install htop

RUN npm install
RUN npm install pm2 -g

EXPOSE 5000

CMD ["pm2-runtime", "server.js"]