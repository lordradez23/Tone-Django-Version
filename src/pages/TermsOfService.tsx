import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const TermsOfService = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - Tone</title>
        <meta name="description" content="Terms of Service for Tone - Read our terms and conditions for using our service." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/">
            <Button variant="ghost" className="mb-8 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-secondary text-sm">Last updated: January 14, 2026</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
              <p className="text-secondary leading-relaxed">
                By accessing or using Tone, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
              <p className="text-secondary leading-relaxed">
                Tone is a communication analysis platform that helps users understand the emotional tone and sentiment of their messages. We use AI technology to analyze text and provide insights to improve communication.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
              <p className="text-secondary leading-relaxed">
                To use certain features of Tone, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-secondary space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Acceptable Use</h2>
              <p className="text-secondary leading-relaxed">
                You agree not to use Tone to:
              </p>
              <ul className="list-disc pl-6 text-secondary space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Submit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
              <p className="text-secondary leading-relaxed">
                All content, features, and functionality of Tone are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Disclaimer of Warranties</h2>
              <p className="text-secondary leading-relaxed">
                Tone is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. The analysis provided is for informational purposes only and should not be relied upon as professional advice.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Limitation of Liability</h2>
              <p className="text-secondary leading-relaxed">
                To the fullest extent permitted by law, Tone shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">8. Changes to Terms</h2>
              <p className="text-secondary leading-relaxed">
                We reserve the right to modify these Terms of Service at any time. We will notify you of significant changes by posting the new terms on this page with an updated date.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
              <p className="text-secondary leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at legal@tone.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
