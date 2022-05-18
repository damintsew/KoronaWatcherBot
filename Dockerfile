FROM node:latest

WORKDIR /usr/koronapay_bot


COPY package.json .
COPY tsconfig.json .
RUN npm install
RUN npm rebuild node-libcurl --build-from-source



RUN mkdir ts
COPY ts ts
RUN npm run build

CMD ["npm", "start"]
