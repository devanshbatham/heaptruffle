# Use an official Node.js runtime as the base image
FROM node:16.20.1

# Set environment variable to prevent prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install required dependencies and Google Chrome
RUN apt-get update && apt-get install -y wget unzip fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libappindicator1 libindicator7 --no-install-recommends \
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i google-chrome-stable_current_amd64.deb; apt-get -fy install \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* google-chrome-stable_current_amd64.deb

# Set a working directory within the container
WORKDIR /app

# Copy your Puppeteer script and other necessary files into the container
COPY script.js package.json ./

# Install Puppeteer and any other dependencies your script needs
RUN npm install

# Set the command to run the Puppeteer script with user-provided parameters
ENTRYPOINT ["node", "script.js"]
