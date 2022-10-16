FROM node:17

WORKDIR /usr/koronapay_bot


COPY package.json .
COPY tsconfig.json .
RUN npm install


RUN mkdir ts
COPY ts ts
RUN npm run build

EXPOSE 3333
CMD ["npm", "start"]

