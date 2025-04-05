# Email Manager

A task management system that can process emails and extract tasks. Built with Node.js, Express, Firebase, and React.

## Project Structure

```
/
├── client/              # React frontend application
├── server/              # Express backend API
├── functions/           # Firebase Cloud Functions
└── shared/              # Shared code between client, server and functions
```

## Features

- Process emails and extract tasks using AI
- Task management with priorities
- User authentication with Firebase
- Multi-language support (English and Hebrew)
- Admin dashboard for managing users and tasks

## Setup

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Firebase account
- OpenAI API key

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_DATABASE_URL=https://your-firebase-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-firebase-project.appspot.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...} # JSON as string

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/email-manager.git
   cd email-manager
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Install client dependencies
   ```
   cd client
   npm install
   cd ..
   ```

4. Install server dependencies
   ```
   cd server
   npm install
   cd ..
   ```

5. Install Firebase Functions dependencies
   ```
   cd functions
   npm install
   cd ..
   ```

### Running the Application

#### Development Mode

1. Start the server
   ```
   cd server
   npm run dev
   ```

2. Start the client
   ```
   cd client
   npm start
   ```

3. For Firebase Functions development, use the Firebase emulator
   ```
   cd functions
   npm run serve
   ```

#### Production Build

1. Build the client
   ```
   cd client
   npm run build
   ```

2. Build the server
   ```
   cd server
   npm run build
   ```

3. Deploy Firebase Functions
   ```
   cd functions
   npm run deploy
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/users/register`: Register a new user
- `POST /api/users/login`: User login
- `POST /api/users/password-reset`: Request password reset
- `GET /api/users/me`: Get current user profile
- `PUT /api/users/me`: Update current user profile

### Task Endpoints

- `GET /api/tasks`: Get all tasks for current user
- `GET /api/tasks/:id`: Get a single task by ID
- `POST /api/tasks`: Create a new task
- `PUT /api/tasks/:id`: Update a task
- `DELETE /api/tasks/:id`: Delete a task
- `PUT /api/tasks/:id/complete`: Mark a task as complete
- `PUT /api/tasks/:id/reopen`: Reopen a completed task
- `PUT /api/tasks/:id/priority`: Change task priority

## Technologies

- **Frontend**: React, TypeScript, MaterialUI, i18next
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **Functions**: Firebase Cloud Functions
- **AI**: OpenAI API for natural language processing
- **Hosting**: Firebase Hosting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributors

Your Name - Initial work - [YourGitHub](https://github.com/yourusername) 