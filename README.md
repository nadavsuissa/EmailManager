# EmailManager - AI-Powered Task Management System

EmailManager is a sophisticated CRM-like web system that integrates with email communications to automatically extract, track, and manage tasks through AI. The system is fully implemented in Hebrew with RTL (Right-to-Left) support.

## 🌟 Features

- **Hebrew Interface**: Complete Hebrew language support with RTL layout
- **Email Integration**: Capture tasks directly from email threads
- **AI Task Extraction**: Automatically extract tasks, deadlines, and relevant information using OpenAI
- **Multilingual Support**: Process emails in both Hebrew and English
- **User Management**: Complete user profiles with role-based permissions
- **Task Dashboard**: Comprehensive task management interface
- **Automated Follow-ups**: Send reminders and request updates automatically in Hebrew
- **Analytics**: Track task completion rates and performance metrics

## 🛠 Tech Stack

- **Frontend**: React.js with TypeScript (with RTL support libraries)
- **Backend**: Node.js & Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **AI Processing**: OpenAI API with Hebrew language model support
- **Email Integration**: Node Mailer / Email API with Hebrew character support
- **Deployment**: Firebase Hosting / Cloud Functions
- **Localization**: i18next or similar for Hebrew language management

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- Firebase account
- OpenAI API key
- Email service account
- Hebrew font support and RTL capabilities

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/email-manager.git
   cd email-manager
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and OpenAI credentials
   ```

4. Run development server
   ```bash
   npm run dev
   ```

## 📂 Project Structure

```
email-manager/
├── client/                # React frontend with Hebrew RTL support
├── server/                # Node.js backend
├── functions/             # Firebase Cloud Functions
├── shared/                # Shared types and utilities
├── locales/               # Hebrew language files and translations
├── scripts/               # Development and deployment scripts
├── docs/                  # Documentation (in Hebrew)
└── config/                # Configuration files
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Hebrew language contributions especially appreciated. 