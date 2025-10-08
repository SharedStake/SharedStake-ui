FROM oven/bun:1-alpine

# install simple http server for serving static content
RUN bun install -g http-server

# make the 'app' folder the current working directory
WORKDIR /app

# copy package.json and bun.lockb (if available)
COPY package.json bun.lockb* ./

# install project dependencies
RUN bun install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

# build app for production with minification
RUN bun run build

EXPOSE 8080
CMD [ "http-server", "dist" ]