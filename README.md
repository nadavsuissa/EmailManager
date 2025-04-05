# Email Manager

A modern email management system that uses AI to extract tasks from emails, analyze priorities, and generate follow-up messages. The application supports both Hebrew and English content.

## Project Structure

The project is organized into the following main directories:

- `client/`: React-based frontend application
- `server/`: Node.js/Express backend server
- `functions/`: Firebase Cloud Functions
- `shared/`: Shared code, types, and configurations used across all parts of the application

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase CLI (for deploying functions)
- OpenAI API key

### Environment Configuration

1. Copy the example environment file:
```bash
cp shared/config/.env.example .env
```

2. Edit the `.env` file and fill in your API keys and configuration values

### Installation

1. Install dependencies in all parts of the application:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

# Install functions dependencies
cd ../functions
npm install
```

2. Build the shared modules (if needed):

```bash
cd shared
npm install
npm run build
```

### Running the Application

#### Development Mode

1. Start the client:
```bash
cd client
npm start
```

2. Start the server:
```bash
cd server
npm run dev
```

3. Emulate Firebase functions (optional):
```bash
cd functions
npm run serve
```

#### Production Mode

1. Build the client:
```bash
cd client
npm run build
```

2. Build the server:
```bash
cd server
npm run build
```

3. Deploy Firebase functions:
```bash
cd functions
npm run deploy
```

## Features

- Task extraction from email content with AI
- Priority analysis for extracted tasks
- Automated follow-up email generation
- Support for both Hebrew and English content
- Real-time updates with Firebase
- Secure authentication and data storage

## Architecture

The application follows a modular architecture:

1. **Client**: React-based frontend that provides the user interface
2. **Server**: Node.js/Express backend that handles API requests and business logic
3. **Firebase Functions**: Serverless functions for processing email content with OpenAI
4. **Shared Module**: Common code shared between client, server, and functions

## License

This project is licensed under the MIT License - see the LICENSE file for details. 