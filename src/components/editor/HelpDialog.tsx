import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Sparkles, BookOpen, Keyboard } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
export function HelpDialog() {
  const setTourComplete = useEditorStore(s => s.setTourComplete);
  const shortcuts = [
    { keys: ["Ctrl", "S"], desc: "Save manually" },
    { keys: ["Ctrl", "P"], desc: "Toggle Preview" },
    { keys: ["Ctrl", "Z"], desc: "Zen Focus Mode" },
    { keys: ["Ctrl", "B"], desc: "Bold selection" },
    { keys: ["Ctrl", "I"], desc: "Italic selection" },
    { keys: ["Ctrl", "H"], desc: "Toggle H1" },
  ];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand-600 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none">
        <div className="bg-brand-600 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <HelpCircle className="w-24 h-24" />
          </div>
          <DialogTitle className="text-2xl font-display font-bold mb-2">How can we help?</DialogTitle>
          <DialogDescription className="text-brand-100">
            Master the art of Markdown with Lumiere's shortcuts and guides.
          </DialogDescription>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5" /> Fast Workflow
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {shortcuts.map((s) => (
                <div key={s.desc} className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/30 text-xs">
                  <span className="text-muted-foreground">{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => (
                      <kbd key={k} className="px-1.5 py-0.5 rounded border bg-background font-mono text-[10px] shadow-sm">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 bg-brand-600 hover:bg-brand-700 rounded-xl py-6" onClick={() => {
              setTourComplete(false);
              window.location.reload();
            }}>
              <Sparkles className="w-4 h-4 mr-2" /> Take UI Tour
            </Button>
            <Button variant="outline" className="flex-1 rounded-xl py-6" asChild>
              <a href="/docs" target="_blank" rel="noopener noreferrer">
                <BookOpen className="w-4 h-4 mr-2" /> Full Documentation
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}