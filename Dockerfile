FROM node:20-alpine

COPY server /server
COPY util /util

WORKDIR /server
RUN npm install

EXPOSE 10000
CMD npm start
