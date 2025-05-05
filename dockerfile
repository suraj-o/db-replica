FROM node:slim 

RUN apt-get update -y && apt-get install -y openssl && apt-get upgrade -y

WORKDIR /app

COPY . .

RUN npm install
RUN npx prisma migrate 

EXPOSE 3000

CMD [ "node", "app.js" ]
