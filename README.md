# Email Manager

AI-powered email management system with task extraction and Hebrew language support.

## Quick Start

1. **Clone the repository**

2. **Setup Environment Variables**
   - The `.env` file should already be configured with your Firebase settings

3. **Install Dependencies**
   ```
   npm run install:all
   ```

4. **Start the Application**
   ```
   npm start
   ```
   This will launch both the client and server:
   - Client: http://localhost:3000
   - Server: http://localhost:5000

## Project Structure

- `client/` - React frontend with TypeScript
- `server/` - Node.js backend with Express
- `shared/` - Shared types and utilities

## Features

- User authentication with Firebase
- Email integration with IMAP/SMTP
- AI-powered task extraction from emails
- RTL support for Hebrew language
- Team/organization management
- Email template management

## Development

- To run only the client: `npm run client`
- To run only the server: `npm run server`
- To build for production: `npm run build`

## API Documentation

### Authentication Endpoints

- `POST /api/users/register`: Register a new user
- `