# Tone - Set the Right Tone Every Time

Tone is an AI-powered real-time messaging application designed for educational environments. Its core mission is to create safer communication spaces for students by using AI to detect harmful content and suggest kinder alternatives in real-time.

**Live Demo:** [https://tone-alpha.vercel.app/](https://tone-alpha.vercel.app/)

## Key Features

- **Real-time Toxicity Detection**: AI-powered analysis flags harmful content before it's sent.
- **Smart Rephrasing Suggestions**: Instant suggestions to rephrase messages more kindly.
- **1-on-1 & Group Chats**: Private messages or group chats for study groups and projects.
- **Online Presence**: Real-time online indicators and typing status.
- **User Status**: Custom status messages visible to other users in real-time.
- **Profile Management**: Update username, email, password, and avatar photo.
- **File Attachments**: Send images and documents in conversations.
- **Message Search**: Search through conversation history with scroll-to highlight.
- **Web Push Notifications**: Receive notifications even when the tab is closed.

## Technologies Used

- **Frontend**: Vite, React, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui, Framer Motion
- **Frontend Auth**: Supabase Auth (`@supabase/supabase-js`)
- **Backend**: Django, Django REST Framework, Django Channels, SimpleJWT
- **Database**: SQLite (via Django ORM)
- **AI Integration**: Google Gemini (gemini-2.0-flash) via google-genai SDK
- **Real-time**: Django Channels (WebSockets)
- **Push Notifications**: Web Push API with VAPID (pywebpush)

## Architecture

- **Frontend auth** is handled by Supabase (sign up, sign in, email confirmation, session management).
- **Backend APIs** (chat, messages, users, file uploads, push) are handled by Django with its own JWT via SimpleJWT.
- **Database** is SQLite — no external database connection required.

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

3. **Create `.env.local`** in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
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
   AI_API_KEY=your-gemini-api-key
   UPLOAD_FOLDER=uploads
   VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_CLAIMS_EMAIL=mailto:admin@tone.app
   ```

4. **Run migrations and start the server**:
   ```sh
   python manage.py makemigrations tone
   python manage.py migrate
   python run.py
   ```

   > **Note**: Always run `python run.py` from inside the `backend/` folder. Running it from the project root will cause a `ModuleNotFoundError: No module named 'asgi'`.

### Supabase Configuration

In your Supabase Dashboard → Authentication → URL Configuration, set:

- **Site URL**: `http://localhost:8080`
- **Redirect URL**: `http://localhost:8080/auth/confirm`

After email confirmation, users are redirected to `/auth/confirm` which then routes them to `/chat`.

## API Endpoints

The backend only needs to be running when testing APIs (e.g. via Postman). The frontend is not required for API testing.

### Auth — `POST /api/auth/signup`
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123"
}
```
Returns `201` with `{ token, user }`.

### Auth — `POST /api/auth/signin`
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```
Returns `200` with `{ token, user }`.

### Auth — `GET /api/auth/me`
Header: `Authorization: Bearer <token>`

### Auth — `PUT /api/auth/profile`
Header: `Authorization: Bearer <token>`
```json
{
  "first_name": "Jane",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "newpass123"
}
```

### Auth — `POST /api/auth/avatar`
Header: `Authorization: Bearer <token>`  
Body: `form-data` → key: `file`, value: image file (png/jpg/jpeg/gif/webp)

## Creating a Superuser

```sh
cd backend
python manage.py create_superuser
```

To reset a superuser password:
```sh
python manage.py changepassword <email>
```

## Build for Production

```sh
npm run build
```

## License

© 2026 Tone. Setting the right tone in every conversation.
