FROM node:20-alpine

COPY Server /srv
COPY util /util

WORKDIR /srv
RUN npm install

EXPOSE 10000
CMD npm start
