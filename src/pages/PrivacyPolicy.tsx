import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - Tone</title>
        <meta name="description" content="Privacy Policy for Tone - Learn how we collect, use, and protect your personal information." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/">
            <Button variant="ghost" className="mb-8 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-secondary text-sm">Last updated: January 14, 2026</p>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
              <p className="text-secondary leading-relaxed">
                Welcome to Tone. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
              <p className="text-secondary leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-secondary space-y-2">
                <li>Account information (email address, username)</li>
                <li>Messages and content you submit for analysis</li>
                <li>Usage data and interaction patterns</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
              <p className="text-secondary leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-secondary space-y-2">
                <li>Provide and maintain our services</li>
                <li>Analyze message tone and sentiment</li>
                <li>Improve and personalize your experience</li>
                <li>Communicate with you about updates and features</li>
                <li>Ensure security and prevent abuse</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">4. Data Security</h2>
              <p className="text-secondary leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">5. Data Retention</h2>
              <p className="text-secondary leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
              <p className="text-secondary leading-relaxed">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-secondary space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
              <p className="text-secondary leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at privacy@tone.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
