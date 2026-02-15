import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Waves, Radar, PenLine, MessagesSquare, ClipboardList, ArrowRight, CheckCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';

const features = [
  {
    icon: Radar,
    title: 'Real-time Toxicity Detection',
    description: 'AI-powered analysis flags harmful content before it\'s sent, protecting students and creating safer conversations.',
  },
  {
    icon: PenLine,
    title: 'Smart Rephrasing Suggestions',
    description: 'Get instant suggestions to rephrase messages more kindly while keeping your original meaning intact.',
  },
  {
    icon: MessagesSquare,
    title: '1-on-1 & Group Chats',
    description: 'Connect with classmates through private messages or create group chats for study groups and projects.',
  },
  {
    icon: ClipboardList,
    title: 'Moderation Logging',
    description: 'All flagged messages are logged for review, helping moderators maintain a positive environment.',
  },
];

const benefits = [
  'Reduce cyberbullying incidents by up to 70%',
  'Create a positive learning environment',
  'Teach students to communicate kindly',
  'Real-time intervention before harm occurs',
  'Easy integration with school systems',
  'FERPA and COPPA compliant',
];

const Landing = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <>
      <Helmet>
        <title>Tone - Set the Right Tone Every Time</title>
        <meta name="description" content="AI-powered chat interface that detects toxic content in real-time, suggests kinder alternatives, and creates a safer space for students to communicate." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-6 h-6 md:w-8 md:h-8 text-safe" />
              <span className="text-lg md:text-xl font-bold text-foreground">Tone</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-secondary hover:text-foreground text-base h-10 px-4">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="bg-safe text-foreground hover:bg-safe/90 text-base h-10 px-4">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile Burger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden bg-background border-b border-border overflow-hidden"
              >
                <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-center text-secondary hover:text-foreground">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-safe text-foreground hover:bg-safe/90">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
                Set the Right Tone<br />
                <span className="text-safe">Every Time</span>
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-secondary max-w-2xl mx-auto mb-6 md:mb-8 px-2">
                AI-powered chat that detects toxic content in real-time, suggests kinder alternatives,
                and creates a safer space for students to communicate.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 sm:px-0">
                <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-safe text-foreground hover:bg-safe/90 w-full h-11 md:h-12 text-sm md:text-base">
                    Create Account
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-11 md:h-12 text-sm md:text-base">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-20 px-4 bg-card/30">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10 md:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 md:mb-4">
                Key Features
              </h2>
              <p className="text-secondary text-sm md:text-base max-w-xl mx-auto px-2">
                Everything you need to create a safer communication environment for your school.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4 md:p-6 hover:border-safe/50 transition-colors"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-safe/10 rounded-lg flex items-center justify-center mb-3 md:mb-4">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-safe" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-secondary text-xs md:text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
                  Why Schools Choose Tone
                </h2>
                <p className="text-secondary text-sm md:text-base mb-6 md:mb-8">
                  Tone is designed specifically for educational environments,
                  helping students learn to communicate respectfully while keeping everyone safe.
                </p>
                <ul className="space-y-3 md:space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-safe flex-shrink-0 mt-0.5" />
                      <span className="text-foreground text-sm md:text-base">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-card border border-border rounded-xl md:rounded-2xl p-5 md:p-8"
              >
                <div className="space-y-3 md:space-y-4">
                  <div className="bg-muted rounded-lg p-3 md:p-4">
                    <p className="text-foreground text-xs md:text-sm">"You're so stupid, can't believe you failed again!"</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-toxic" />
                      <span className="text-secondary text-xs leading-tight">Tone Protected</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-safe" />
                  </div>

                  <div className="bg-safe/10 border border-safe/30 rounded-lg p-3 md:p-4">
                    <p className="text-foreground text-xs md:text-sm">"I know that was tough, but don't give up. Want to study together next time?"</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-safe" />
                      <span className="text-xs text-safe">Safe & supportive</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20 px-4 bg-card/30">
          <div className="container mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
                Ready to Create a Safer Space?
              </h2>
              <p className="text-secondary text-sm md:text-base max-w-xl mx-auto mb-6 md:mb-8 px-2">
                Join Tone today and help build a more positive communication culture in your school.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-safe text-foreground hover:bg-safe/90 h-11 md:h-12 text-sm md:text-base">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 md:py-12 px-4 border-t border-border">
          <div className="container mx-auto flex flex-col items-center justify-center text-center gap-4">
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 md:w-6 md:h-6 text-safe" />
              <span className="text-foreground font-medium text-base md:text-lg">Tone</span>
            </div>
            <div className="flex items-center gap-4 text-xs md:text-sm">
              <Link to="/privacy" className="text-secondary hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <span className="text-border">|</span>
              <Link to="/terms" className="text-secondary hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-secondary text-xs md:text-sm max-w-md">
              © 2026 Tone. Setting the right tone in every conversation.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
