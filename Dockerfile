FROM node:20-alpine

COPY server /server
COPY util /util

#WORKDIR /server
#COPY package*.json ./
RUN cd server && npm install

EXPOSE 10000
CMD cd server && npm start
