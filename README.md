# Raspberry Pi 5 NAS System

A modern, full-featured Network Attached Storage (NAS) system designed for Raspberry Pi 5, featuring a beautiful UI inspired by Ubiquiti's UniFi Drive.

## Features

- 🎨 **Modern UI**: Clean, dark-themed interface inspired by UniFi Drive
- 📁 **Full File Management**: Upload, download, organize files and folders
- 👥 **User Management**: Admin and regular user roles with proper access control
- 🔍 **Search**: Full-text search for files and folders
- 📊 **Activity Logs**: Track all file operations and user activities
- 🎬 **Media Support**: Preview images, videos, and audio files
- 💾 **Storage Management**: Monitor disk usage and manage storage
- 🚀 **Easy Deployment**: Automated setup script for quick installation
- 🔐 **Secure**: JWT-based authentication with bcrypt password hashing

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB 8.0 with Prisma ORM
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT tokens

## Prerequisites

- Raspberry Pi 5 running Raspberry Pi OS (64-bit)
- Docker and Docker Compose installed
- At least 4GB RAM recommended
- Sufficient storage space for your files

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ollieCookQuest/nas_rpi.git
   cd nas_rpi
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

   The setup script will:
   - Check and install Docker if needed
   - Create necessary directories
   - Generate environment configuration
   - Build and start all containers
   - Set up the database
   - Create an admin user

3. **Access the application**:
   Open your browser and navigate to `http://localhost:3000` (or the port you configured)

4. **Login**:
   Use the admin credentials you created during setup

## Manual Installation

If you prefer to set up manually:

1. **Create `.env` file** from `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start the services**:
   ```bash
   docker compose up -d --build
   ```

3. **Initialize the database**:
   ```bash
   cd app
   npm install
   npx prisma generate
   npx prisma db push
   ```

4. **Create an admin user**:
   You can create an admin user through the signup page, or use the Prisma CLI to create one directly in the database.

## Configuration

Edit the `.env` file to configure:

- **MongoDB**: Root username, password, and database name
- **Application**: Port, JWT secret, storage path
- **Upload Limits**: Maximum file size

## Usage

### For Regular Users

- **Files**: Navigate to Files to upload, download, and manage your files
- **Search**: Use the Search page to find files and folders quickly
- **Activity**: View your recent file operations in the Activity page

### For Administrators

- **User Management**: Manage users, create accounts, and assign roles
- **Storage**: Monitor system-wide storage usage
- **Settings**: Configure system settings and view system information

## Project Structure

```
nas_rpi/
├── app/                      # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities and helpers
│   ├── prisma/              # Prisma schema and migrations
│   └── Dockerfile           # Application container
├── docker-compose.yml       # Docker orchestration
├── setup.sh                 # Automated setup script
└── README.md               # This file
```

## Development

To run in development mode:

```bash
cd app
npm install
npm run dev
```

The application will run on `http://localhost:3000`.

## NFS Integration

For NFS file sharing, you'll need to configure NFS on your Raspberry Pi host or use a separate NFS container. The system is designed to work with both approaches.

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- File paths are validated to prevent directory traversal attacks
- Upload sizes are limited by configuration
- Role-based access control for admin features

## Troubleshooting

### MongoDB connection issues

Check that MongoDB is running:
```bash
docker compose ps
```

View MongoDB logs:
```bash
docker compose logs mongodb
```

### Application won't start

Check application logs:
```bash
docker compose logs app
```

### Permission issues

Ensure Docker has proper permissions:
```bash
sudo usermod -aG docker $USER
# Log out and log back in
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

