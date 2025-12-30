import React from 'react';
import { Check, X, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useEditorStore } from '@/lib/store';
const FEATURES = [
  { name: 'Document Limit', basic: '10 Documents', pro: 'Unlimited' },
  { name: 'Cloud Sync', basic: false, pro: true },
  { name: 'Public Sharing', basic: false, pro: true },
  { name: 'Version History', basic: false, pro: true },
  { name: 'Export to PDF', basic: 'Print only', pro: 'Native PDF' },
  { name: 'Export to HTML', basic: true, pro: true },
  { name: 'Custom Domains', basic: false, pro: true },
  { name: 'Priority Support', basic: false, pro: true },
];
export function PricingPage() {
  const navigate = useNavigate();
  const token = useEditorStore(s => s.token);
  const handleSelectPlan = (plan: 'free' | 'pro') => {
    if (plan === 'free') {
      navigate('/app');
      toast.success("Welcome to Basic Tier!");
    } else {
      if (!token) {
        navigate('/auth');
        toast.info("Please sign up to upgrade to Pro");
      } else {
        toast.success("Checkout initialized (Mock)");
      }
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">Simple, honest pricing.</h1>
          <p className="text-xl text-muted-foreground">Focus on your writing, not your subscription. Choose the plan that fits your creative workflow.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-32">
          {/* Basic Plan */}
          <Card className="p-10 rounded-[2.5rem] border-2 flex flex-col h-full bg-card/50">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <p className="text-muted-foreground mb-6">Perfect for students and casual writers.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </div>
            <div className="space-y-4 mb-10 flex-1">
              {['10 Local Documents', 'Standard Preview', 'Basic Markdown', 'Print to PDF'].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
              {['Cloud Sync', 'Public Sharing'].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-muted-foreground/60">
                  <X className="w-5 h-5 shrink-0" />
                  <span className="line-through">{f}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="lg" className="w-full h-14 rounded-xl text-lg border-2" onClick={() => handleSelectPlan('free')}>
              Get Started
            </Button>
          </Card>
          {/* Pro Plan */}
          <Card className="p-10 rounded-[2.5rem] border-2 border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-6 right-6">
               <div className="bg-brand-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-white" /> Recommended
               </div>
            </div>
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-muted-foreground mb-6">For power users and professional writers.</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-display font-bold">$9</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <div className="space-y-4 mb-10 flex-1">
              {['Unlimited Documents', 'Full Cloud Sync', 'Custom Shared Links', 'Version Snapshots', 'Native PDF Export', 'Priority Support'].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm font-medium">
                  <Check className="w-5 h-5 text-brand-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full h-14 rounded-xl text-lg bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-500/20" onClick={() => handleSelectPlan('pro')}>
              Go Pro <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">Feature Comparison</h2>
          <div className="rounded-3xl border bg-card overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-6 text-sm font-bold uppercase tracking-wider">Feature</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider">Basic</th>
                    <th className="p-6 text-sm font-bold uppercase tracking-wider">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {FEATURES.map((row) => (
                    <tr key={row.name} className="hover:bg-muted/10 transition-colors">
                      <td className="p-6 text-sm font-medium">{row.name}</td>
                      <td className="p-6 text-sm text-muted-foreground">
                        {typeof row.basic === 'boolean' ? (row.basic ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4" />) : row.basic}
                      </td>
                      <td className="p-6 text-sm font-bold text-brand-600">
                        {row.pro === true ? <Check className="w-4 h-4" /> : row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}