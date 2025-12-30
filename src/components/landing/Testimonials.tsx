import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
const TESTIMONIALS = [
  { name: "Sarah Drasner", role: "Senior Engineer", quote: "Lumiere is the first Markdown editor that actually lets me focus. The edge sync is magical.", avatar: "https://i.pravatar.cc/150?u=sarah" },
  { name: "James Quick", role: "Content Creator", quote: "Pixel-perfect preview and Mermaid support? This is a game changer for my technical writing.", avatar: "https://i.pravatar.cc/150?u=james" },
  { name: "Elena Rossi", role: "Fiction Author", quote: "The minimalist design helps me reach my daily word count without distractions. Simply beautiful.", avatar: "https://i.pravatar.cc/150?u=elena" },
  { name: "Mark Dalgleish", role: "DX Engineer", quote: "The export engine 'The Press' produces better looking PDFs than any plugin I've used.", avatar: "https://i.pravatar.cc/150?u=mark" },
  { name: "Jessica Rose", role: "Community Lead", quote: "I love the public share feature. It makes collaborating on drafts incredibly smooth.", avatar: "https://i.pravatar.cc/150?u=jess" },
];
export function Testimonials() {
  return (
    <section className="py-24 overflow-hidden bg-muted/10">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <h2 className="text-3xl font-display font-bold">Loved by creators worldwide</h2>
      </div>
      <div className="flex relative">
        <motion.div 
          className="flex gap-6 pr-6"
          animate={{ x: [0, -1920] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div key={i} className="w-[400px] shrink-0 p-8 rounded-3xl bg-card/50 backdrop-blur-sm border shadow-sm space-y-6">
              <div className="flex gap-1 text-brand-600">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-brand-600" />)}
              </div>
              <p className="text-lg leading-relaxed italic">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full border" />
                <div>
                  <h4 className="font-bold text-sm">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}