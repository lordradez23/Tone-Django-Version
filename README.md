# Tone - Set the Right Tone Every Time

Tone is an AI-powered real-time messaging application specifically designed for educational environments. Its core mission is to create safer communication spaces for students by using AI to detect harmful content and suggest kinder alternatives in real-time.

## 🚀 Key Features

- **Real-time Toxicity Detection**: AI-powered analysis flags harmful content before it's sent, protecting students and creating safer conversations.
- **Smart Rephrasing Suggestions**: Get instant suggestions to rephrase messages more kindly while keeping your original meaning intact.
- **1-on-1 & Group Chats**: Connect with classmates through private messages or create group chats for study groups and projects.
- **Online Presence**: Track active users in real-time with "Tone Protected" indicators.
- **School Friendly**: Designed with school safety and positivity in mind, helping students learn to communicate respectfully.

## 🛠️ Technologies Used

- **Frontend**: Vite, React, TypeScript
- **Styling**: Tailwind CSS, shadcn-ui, Framer Motion
- **Backend/Database**: Supabase
- **AI Integration**: Edge Functions for real-time message analysis

## 🏁 Getting Started

### Prerequisites

- Node.js & npm installed

### Installation

1. **Clone the repository**:
   ```sh
   git clone https://github.com/lordradez23/Tone.git
   ```

2. **Navigate to the project directory**:
   ```sh
   cd Tone
   ```

3. **Install dependencies**:
   ```sh
   npm install
   ```

4. **Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

5. **Start the development server**:
   ```sh
   npm run dev
   ```

## 📦 Build for Production

To create an optimized production build:

```sh
npm run build
```

## 📄 License

© 2026 Tone. Setting the right tone in every conversation.
