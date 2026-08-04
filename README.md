# Tone - Set the Right Tone Every Time

```
                /||\
                ||||
                ||||
                |||| /|\
           /|\  |||| |||
           |||  |||| |||
           |||  |||| |||
           |||  |||| d||
           |||  |||||||/
           ||b._||||~~'
           \||||||||
            `~~~||||
                ||||
                ||||
~~~~~~~~~~~~~~~~||||~~~~~~~~~~~~~~
  \/..__..--  . |||| \/  .  ..
\/         \/ \/    \/
        .  \/              \/    .
. \/             .   \/     .
   __...--..__..__       .     \/
\/  .   .    \/     \/    __..--..
```

Tone is an AI-powered real-time messaging application specifically designed for educational environments. Its core mission is to create safer communication spaces for students by using AI to detect harmful content and suggest kinder alternatives in real-time.

**Live Demo:** [https://tone-alpha.vercel.app/](https://tone-alpha.vercel.app/)

## Key Features

- **Real-time Toxicity Detection**: AI-powered analysis flags harmful content before it's sent, protecting students and creating safer conversations.
- **Smart Rephrasing Suggestions**: Get instant suggestions to rephrase messages more kindly while keeping your original meaning intact.
- **1-on-1 & Group Chats**: Connect with classmates through private messages or create group chats for study groups and projects.
- **Online Presence**: Track active users in real-time with online indicators and typing status.
- **User Status**: Set a custom status message visible to other users in real-time.
- **Profile Management**: Update username, email, password, and avatar photo with persistent storage.
- **File Attachments**: Send images and documents in conversations.
- **Message Search**: Search through conversation history with scroll-to highlight.
- **Web Push Notifications**: Receive notifications even when the tab is closed.
- **School Friendly**: Designed with school safety and positivity in mind, helping students learn to communicate respectfully.

## Technologies Used

- **Frontend**: Vite, React, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui, Framer Motion
- **Backend**: Flask, SQLite (via SQLAlchemy), Flask-SocketIO, Flask-JWT-Extended
- **AI Integration**: Google Gemini (gemini-2.0-flash) via google-genai SDK
- **Real-time**: Socket.IO for live messaging, typing indicators, and presence
- **Push Notifications**: Web Push API with VAPID (pywebpush)

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+

### Frontend Setup

1. **Clone the repository**:
   ```sh
   git clone https://github.com/lordradez23/Tone.git
   cd Tone
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Create `.env`** in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the dev server**:
   ```sh
   npm run dev
   ```

### Backend Setup

1. **Navigate to the backend folder**:
   ```sh
   cd backend
   ```

2. **Install Python dependencies**:
   ```sh
   pip install -r requirements.txt
   ```

3. **Create `backend/.env`**:
   ```env
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   DATABASE_URL=sqlite:///tone.db
   AI_API_KEY=your-gemini-api-key
   UPLOAD_FOLDER=uploads
   VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_CLAIMS_EMAIL=mailto:admin@tone.app
   ```

4. **Run the backend**:
   ```sh
   python run.py
   ```

## Build for Production

```sh
npm run build
```

## License

© 2026 Tone. Setting the right tone in every conversation.
