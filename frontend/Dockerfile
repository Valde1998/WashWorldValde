FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:5001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npm run start -- -p ${PORT:-3000}"]
