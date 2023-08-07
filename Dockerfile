# Use an official Node.js runtime as the base image
FROM node:16.20.1

# Install required libraries
RUN apt-get update \
    && apt-get install -y libx11-xcb1 libxcb-dri3-0 libxcb-present0 libxcb-randr0 libxcb-xfixes0 libxshmfence1 libcups2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

# Set a working directory within the container
WORKDIR /app

# Copy your Puppeteer script and other necessary files into the container
COPY script.js ./

# Install Puppeteer and any other dependencies your script needs
RUN npm install puppeteer

# Set the command to run the Puppeteer script with user-provided parameters
ENTRYPOINT ["node", "script.js"]
