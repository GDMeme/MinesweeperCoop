FROM node:20-alpine

COPY Server /srv
WORKDIR /srv
RUN npm install

EXPOSE 8080
CMD npm start server.sh
