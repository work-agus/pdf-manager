# Use official Node.js image (slim version for smaller size)
FROM node:18-slim

# Install system dependencies (poppler-utils contains pdftoppm)
RUN apt-get update && \
    apt-get install -y poppler-utils && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build CSS (Tailwind)
# We need to run this during build since the 'start' script expects it
RUN npm run build:css

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
