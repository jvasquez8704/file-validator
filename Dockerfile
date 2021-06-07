FROM node:14-slim

ARG ENV=
ENV ENV=${ENV}

# Create app directory

WORKDIR /api
RUN mkdir -p /api/uploads
COPY package*.json /api
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
#COPY ["package.json", "package-lock.json*", "api/"]

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production
COPY . /api

# Bundle app source
EXPOSE 443

CMD [ "node", "index.js" ]
