# Use an official Node.js runtime as the base image
FROM node:16.20.1

# Set environment variable to prevent prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install required libraries and Google Chrome
RUN apt-get update && apt-get install -y wget gnupg --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set a working directory within the container
WORKDIR /app

# Copy your Puppeteer script and other necessary files into the container
COPY script.js package.json ./

# Install Puppeteer and any other dependencies your script needs
RUN npm install

# Set the command to run the Puppeteer script with user-provided parameters
ENTRYPOINT ["node", "script.js"]
