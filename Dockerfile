# STAGE 1: BUILD REACT FRONTEND
FROM node:22-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# STAGE 2: RUN EXPRESS BACKEND
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

COPY index.js ./
COPY routes/ ./routes/
COPY models/ ./models/
COPY middleware/ ./middleware/

# Do not copy .env or any secret files into the image.
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "index.js"]