#!/bin/bash

set -e

echo "=========================================="
echo "NAS System Setup for Raspberry Pi 5"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Raspberry Pi (optional check)
if [ ! -f /proc/device-tree/model ]; then
    echo -e "${YELLOW}Warning: This script is designed for Raspberry Pi. Continuing anyway...${NC}"
fi

# Check for Docker
echo "Checking for Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed.${NC}"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully!${NC}"
    echo -e "${YELLOW}Please log out and log back in for Docker group changes to take effect.${NC}"
    exit 1
else
    echo -e "${GREEN}Docker is installed.${NC}"
fi

# Check for Docker Compose
echo "Checking for Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed.${NC}"
    echo "Installing Docker Compose..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed successfully!${NC}"
else
    echo -e "${GREEN}Docker Compose is installed.${NC}"
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p data/storage
mkdir -p data/postgres
mkdir -p data/config
echo -e "${GREEN}Directories created.${NC}"

# Check if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}.env file already exists.${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file."
    else
        rm .env
        CREATE_ENV=true
    fi
else
    CREATE_ENV=true
fi

# Create .env file
if [ "$CREATE_ENV" = true ]; then
    echo "Creating .env file..."
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Prompt for PostgreSQL password
    echo ""
    read -sp "Enter PostgreSQL password (default: change_me_secure_password): " POSTGRES_PASSWORD
    echo ""
    POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-change_me_secure_password}
    
    # Prompt for PostgreSQL username
    read -p "Enter PostgreSQL username (default: postgres): " POSTGRES_USER
    POSTGRES_USER=${POSTGRES_USER:-postgres}
    
    # Prompt for app port
    read -p "Enter application port (default: 3000): " APP_PORT
    APP_PORT=${APP_PORT:-3000}
    
    # Prompt for host/IP
    read -p "Enter server host/IP (default: localhost): " SERVER_HOST
    SERVER_HOST=${SERVER_HOST:-localhost}
    
    # Prompt for storage path
    read -p "Enter storage path (default: ./data/storage): " STORAGE_PATH
    STORAGE_PATH=${STORAGE_PATH:-./data/storage}
    
    # Create .env file
    cat > .env << EOF
# PostgreSQL Configuration
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=nas

# Database URL for Prisma
DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres:5432/nas

# Application Configuration
APP_PORT=$APP_PORT
NEXTAUTH_URL=http://${SERVER_HOST}:$APP_PORT
AUTH_URL=http://${SERVER_HOST}:$APP_PORT

# Auth Secret (NextAuth.js)
JWT_SECRET=$JWT_SECRET
AUTH_SECRET=$JWT_SECRET

# Storage Configuration
STORAGE_PATH=/data/storage
UPLOAD_MAX_SIZE=10737418240
EOF
    
    echo -e "${GREEN}.env file created.${NC}"
fi

# Build and start containers
echo ""
echo "Building and starting containers..."
docker compose up -d --build

echo ""
echo -e "${GREEN}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Run Prisma migrations
echo "Running database migrations..."
docker compose exec app sh -c "cd /app && npm install && npx prisma generate && npx prisma db push" || {
    echo -e "${YELLOW}Note: Running migrations from host...${NC}"
    cd app
    npm install || echo "npm install already done or failed"
    npx prisma generate
    npx prisma db push
    cd ..
}

# Create admin user
echo ""
echo "Creating admin user..."
read -p "Enter admin email: " ADMIN_EMAIL
read -p "Enter admin username: " ADMIN_USERNAME
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

# Create admin user via Prisma
echo "Creating admin user in database..."
docker compose exec app node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 12);
    const user = await prisma.user.create({
      data: {
        email: '$ADMIN_EMAIL',
        username: '$ADMIN_USERNAME',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created successfully!');
    console.log('Email:', user.email);
    console.log('Username:', user.username);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists, skipping...');
    } else {
      console.error('Error creating admin user:', error.message);
    }
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
" || echo -e "${YELLOW}Note: Admin user creation via Docker failed. You can create it manually after starting the app.${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Setup completed successfully!${NC}"
echo "=========================================="
echo ""
echo "The NAS system is now running!"
echo "Access the web interface at: http://localhost:$APP_PORT"
echo ""
echo "Network services:"
echo "  NFS Server: port 2049 (TCP/UDP)"
echo "  SMB/CIFS Server: ports 139, 445"
echo ""
echo "Admin credentials:"
echo "  Email: $ADMIN_EMAIL"
echo "  Username: $ADMIN_USERNAME"
echo ""
echo "Next steps:"
echo "  1. Log in to the web interface"
echo "  2. Go to Admin → NAS Shares"
echo "  3. Create your first NFS or SMB share"
echo "  4. Use the Connection Guide to connect from your devices"
echo ""
echo "To stop the system: docker compose down"
echo "To view logs: docker compose logs -f"
echo "To check NFS/SMB status: docker compose logs nfs-server samba"
echo ""

