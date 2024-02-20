FROM node:16.15.1-buster-slim

WORKDIR /app

COPY . .

# RUN apt update
# RUN apt install htop

RUN npm install
RUN npm install pm2 -g

EXPOSE 5001

CMD ["pm2-runtime", "server.js"]
