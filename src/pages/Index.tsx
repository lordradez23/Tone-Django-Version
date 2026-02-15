import { ToneInterface } from "@/components/ToneInterface";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Tone - Set the Right Tone Every Time</title>
        <meta name="description" content="AI-powered chat interface that detects toxic content in real-time, suggests kinder alternatives, and creates a safer space for students to communicate." />
      </Helmet>
      <main className="h-screen bg-background">
        <ToneInterface />
      </main>
    </>
  );
};

export default Index;
