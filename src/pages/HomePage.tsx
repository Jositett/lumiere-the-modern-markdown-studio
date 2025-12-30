import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sparkles, Zap, Shield, Globe, ArrowRight, Check, Code, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Testimonials } from '@/components/landing/Testimonials';
import { toast } from 'sonner';
export function HomePage() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('lumiere_token') : null;
  const [email, setEmail] = useState('');
  const handleStartWriting = () => {
    // If not logged in, they enter as guest. If logged in, they go to app.
    navigate('/app');
  };
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand-100 overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">Lumiere</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/pricing" className="hover:text-brand-600 transition-colors">Pricing</Link>
            <Link to="/docs" className="hover:text-brand-600 transition-colors">Docs</Link>
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle className="static" />
            {!token ? (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button onClick={handleStartWriting} className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
                  Start Writing
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/app')} className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg">
                Go to Studio
              </Button>
            )}
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-24 left-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-24 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-left space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider"
              >
                <Sparkles className="w-3 h-3" />
                <span>The Future of Markdown</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-6xl md:text-7xl font-display font-bold tracking-tighter leading-[0.9]"
              >
                Pure focus. <br />
                <span className="text-brand-600">Zero friction.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-lg leading-relaxed"
              >
                Lumiere is a professional-grade Markdown studio that stays out of your way. Real-time edge sync, pixel-perfect preview, and sophisticated export tools.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <Button onClick={handleStartWriting} size="lg" className="h-14 px-8 text-lg bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/20 rounded-xl">
                  Try Guest Mode <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" asChild className="h-14 px-8 text-lg rounded-xl border-2">
                  <Link to="/pricing">View Pro Plans</Link>
                </Button>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
              <div className="relative rounded-2xl border bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden aspect-[4/3]">
                <div className="h-8 border-b bg-muted/50 flex items-center px-4 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="p-8 space-y-4">
                   <div className="h-4 w-3/4 bg-brand-100 dark:bg-brand-900/40 rounded animate-pulse" />
                   <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                   <div className="h-32 w-full bg-muted/30 rounded-xl border border-dashed flex items-center justify-center">
                      <Code className="w-12 h-12 text-muted-foreground/20" />
                   </div>
                   <div className="space-y-2">
                     <div className="h-3 w-full bg-muted rounded" />
                     <div className="h-3 w-full bg-muted rounded" />
                     <div className="h-3 w-2/3 bg-muted rounded" />
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Features Grid */}
      <section id="features" className="py-24 bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-display font-bold">Built for serious writers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to go from a rough draft to a published masterpiece.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Globe, title: "Edge Sync", desc: "Sync your work globally with 0ms perceived latency using Cloudflare Durable Objects." },
              { icon: Shield, title: "Private by Default", desc: "Your data is yours. Optional end-to-end encryption for sensitive drafts." },
              { icon: Zap, title: "Markdown+", desc: "Support for GFM, MathML, Mermaid diagrams, and custom callouts out of the box." },
              { icon: Check, title: "Autosave", desc: "Never lose a keystroke. Every change is tracked and versioned automatically." },
              { icon: MessageSquare, title: "Public Sharing", desc: "Publish drafts to a clean, read-only URL with one click." },
              { icon: Code, title: "The Press Engine", desc: "Export to pixel-perfect PDF, standalone HTML, or raw Markdown." },
            ].map((f, i) => (
              <div key={i} className="p-8 bg-card rounded-3xl border shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 mb-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Testimonials />
      {/* Pricing Teaser */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto p-12 bg-brand-600 rounded-[3rem] text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
            <h2 className="text-4xl font-display font-bold mb-6">Upgrade to Lumiere Professional</h2>
            <p className="text-brand-100 text-lg mb-10 max-w-lg mx-auto">Unlock unlimited documents, advanced cloud sync, and priority export for just <span className="text-white font-bold">$9/mo</span>.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-brand-600 hover:bg-brand-50 px-8 h-14 text-lg rounded-xl">
                <Link to="/pricing">Compare Plans</Link>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 h-14 px-8 text-lg rounded-xl">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>
      <footer className="py-20 border-t bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 space-y-6">
              <div className="flex items-center gap-2 font-display font-bold text-2xl">
                <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-white" /></div>
                Lumiere
              </div>
              <p className="text-muted-foreground max-w-sm">
                The minimalist studio for modern writing. Built with focus and speed at its core.
              </p>
              <form className="flex gap-2 max-w-sm" onSubmit={(e) => { e.preventDefault(); toast.success("Joined the waitlist!"); setEmail(''); }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-background border rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <Button type="submit" size="sm" className="bg-brand-600">Join Waitlist</Button>
              </form>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/docs">Documentation</Link></li>
                <li><Link to="/app">Guest Studio</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t text-sm text-muted-foreground gap-4">
            <p>© 2025 Lumiere Markdown Studio. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-brand-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-brand-600 transition-colors">GitHub</a>
              <a href="#" className="hover:text-brand-600 transition-colors">Dribbble</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}