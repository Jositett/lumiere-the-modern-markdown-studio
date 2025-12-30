import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sparkles, Zap, Shield, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand-100">
      <ThemeToggle />
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 text-brand-600 dark:text-brand-400 text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Now with real-time cloud sync</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-8"
          >
            Illuminating the <br />
            <span className="text-brand-600 italic">art of writing</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty"
          >
            Lumiere is a minimalist Markdown studio built for focus. Write with speed, preview in real-time, and sync across the globe with Cloudflare's edge.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="bg-brand-600 hover:bg-brand-700 text-white px-8 h-14 text-lg rounded-xl shadow-xl shadow-brand-500/20">
              <Link to="/app">
                Start Writing <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl border-2">
              View Showcase
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-20 relative rounded-2xl border bg-card shadow-2xl overflow-hidden aspect-video max-w-5xl mx-auto group"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=2000&q=80" 
              alt="Editor Preview" 
              className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                  <Zap className="w-12 h-12 text-white fill-white" />
               </div>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Instant Preview</h3>
              <p className="text-muted-foreground">See your changes as you type with our high-performance rendering engine.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Edge Sync</h3>
              <p className="text-muted-foreground">Your documents are replicated across 300+ global data centers for zero-latency access.</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Privacy First</h3>
              <p className="text-muted-foreground">End-to-end encryption ensures only you can see what you write.</p>
            </div>
          </div>
        </div>
      </section>
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-display font-bold text-xl">Lumiere</div>
          <div className="text-sm text-muted-foreground">© 2025 Lumiere Studio. Powered by Cloudflare Workers.</div>
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-brand-600 transition-colors">Twitter</a>
            <a href="#" className="hover:text-brand-600 transition-colors">GitHub</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}