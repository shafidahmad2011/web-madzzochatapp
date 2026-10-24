FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install

COPY . .

RUN addgroup -S app && adduser -S app -G app -u 1000 \
    && chown -R app:app /app

USER 1000

EXPOSE 3000

CMD ["npm", "start"]
