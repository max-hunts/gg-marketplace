FROM node:latest
WORKDIR /usr/src/app
COPY . .
RUN npm install
EXPOSE 5000
RUN apt update
RUN apt install htop
CMD [ "node", "server.js" ]
