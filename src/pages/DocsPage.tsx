import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Book, Zap, Shield, Share2, Printer, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
const SECTIONS = [
  { id: 'start', title: 'Getting Started', icon: Book },
  { id: 'shortcuts', title: 'Keyboard Shortcuts', icon: Zap },
  { id: 'markdown', title: 'Markdown Guide', icon: Shield },
  { id: 'export', title: 'The Press (Exporting)', icon: Printer },
  { id: 'sharing', title: 'Cloud Sync & Sharing', icon: Share2 },
];
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('start');
  const [search, setSearch] = useState('');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link to="/app"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-3xl font-display font-bold">Lumiere Documentation</h1>
          </div>
          <div className="relative w-64 hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search guide..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/50 border-none focus-visible:ring-brand-500" 
            />
          </div>
        </header>
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0 space-y-1 pt-4">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  activeSection === section.id 
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400 shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <section.icon className={cn("w-4 h-4", activeSection === section.id ? "text-brand-600" : "text-muted-foreground group-hover:text-foreground")} />
                {section.title}
                <ChevronRight className={cn("w-3 h-3 ml-auto opacity-0 transition-opacity", activeSection === section.id && "opacity-100")} />
              </button>
            ))}
          </aside>
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article className="prose prose-slate dark:prose-invert max-w-none">
              {activeSection === 'start' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h2>Getting Started</h2>
                  <p>Lumiere is designed to be the most focused and elegant writing environment on the web. Here is how to get the most out of your studio.</p>
                  <h3>Creating your first document</h3>
                  <p>Click the <strong>New Document</strong> button in the sidebar. Your document is automatically synced to Cloudflare's edge as you type.</p>
                  <h3>Split-Pane View</h3>
                  <p>By default, Lumiere shows the editor on the left and the preview on the right. You can toggle this with the Eye icon in the top toolbar or drag the center handle to resize.</p>
                </div>
              )}
              {activeSection === 'shortcuts' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h2>Keyboard Shortcuts</h2>
                  <p>Power through your writing without taking your hands off the keyboard.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    {[
                      { key: 'Cmd/Ctrl + S', desc: 'Force Manual Save' },
                      { key: 'Cmd/Ctrl + B', desc: 'Bold Text' },
                      { key: 'Cmd/Ctrl + I', desc: 'Italic Text' },
                      { key: 'Cmd/Ctrl + P', desc: 'Toggle Preview' },
                      { key: 'Cmd/Ctrl + Z', desc: 'Zen/Focus Mode' },
                      { key: 'Cmd/Ctrl + H', desc: 'Heading 1' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-muted/30 border rounded-xl">
                        <span className="text-sm font-mono bg-background px-2 py-1 rounded border shadow-sm">{item.key}</span>
                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeSection === 'markdown' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h2>Markdown Guide</h2>
                  <p>Lumiere supports standard GitHub Flavored Markdown (GFM) plus advanced extensions for diagrams and math.</p>
                  <pre><code>{`# Heading 1
## Heading 2
- List Item
1. Numbered Item
**Bold** and *Italic*
[Link](https://lumiere.studio)`}</code></pre>
                  <h3>Advanced Features</h3>
                  <p>Include <strong>Mermaid diagrams</strong> using code blocks:</p>
                  <pre><code>{`\`\`\`mermaid
graph TD;
    A-->B;
    A-->C;
\`\`\``}</code></pre>
                </div>
              )}
              {activeSection === 'export' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h2>The Press Export Engine</h2>
                  <p>Lumiere doesn't just store text; it helps you publish. Use 'The Press' to export in multiple formats.</p>
                  <ul>
                    <li><strong>PDF Export:</strong> High-quality, paginated PDF output.</li>
                    <li><strong>Styled HTML:</strong> A standalone file with beautiful CSS embedded.</li>
                    <li><strong>Markdown:</strong> Download the raw file for use in other tools.</li>
                  </ul>
                </div>
              )}
              {activeSection === 'sharing' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h2>Cloud Sync & Sharing</h2>
                  <p>Lumiere uses <strong>Durable Objects</strong> at the edge to ensure your work is always safe and available.</p>
                  <h3>Public Links</h3>
                  <p>Enable 'Public' in the share menu to get a unique link. Anyone with this link can view your document with a read-optimized interface.</p>
                </div>
              )}
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}