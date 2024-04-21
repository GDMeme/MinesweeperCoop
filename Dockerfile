FROM node:20-alpine

COPY Server /srv
WORKDIR /srv
RUN npm install

EXPOSE 10000
CMD npm start server.sh
