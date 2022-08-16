FROM node:17

WORKDIR /usr/koronapay_bot


COPY package.json .
COPY tsconfig.json .
RUN npm install


RUN mkdir ts
COPY ts ts
RUN npm run build

CMD ["npm", "start"]
