# Name the node stage
FROM node:14.17.0
# Set working directory
WORKDIR /app
# Copy all files from current directory to working dir in image
COPY . .
# install node modules and build assets
RUN npm install
# Containers run nginx with global directives and daemon off
ENTRYPOINT ["node", "backend/server.js"]
