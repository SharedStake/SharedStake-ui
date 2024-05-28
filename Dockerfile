# Use the official Node.js image as the base image
FROM node:16-alpine

# Set the working directory in the container
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install git
RUN apk update && apk add --no-cache git

# Copy the entire project into the container
COPY . .

# Install app dependencies
RUN npm install

# Start the application
CMD ["npm", "run", "serve"]
