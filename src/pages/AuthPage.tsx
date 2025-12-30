import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useEditorStore(s => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = isLogin
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password });
      if (error) {
        toast.error(error.message || 'Auth failed');
      } else if (data?.user) {
        await setAuth(data.user as any);
        navigate('/app');
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <TopNav />
      <div className="hidden lg:flex flex-col justify-between p-12 bg-brand-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent)]" />
        <div className="relative z-10 flex items-center gap-2 text-2xl font-display font-bold">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-white" />
          </div>
          Lumiere
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-5xl font-display font-bold leading-tight">Your story, illuminated by focus.</h1>
          <p className="text-xl text-brand-100 max-w-md">The professional Markdown environment for serious writers.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-display font-bold tracking-tight">
              {isLogin ? 'Welcome back' : 'Join Lumiere'}
            </h2>
          </div>
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button className="w-full bg-brand-600 hover:bg-brand-700 h-11 text-lg rounded-lg" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isLogin ? 'Login' : 'Sign Up'}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardHeader>
            <CardFooter />
          </Card>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "New to Lumiere?" : "Already have an account?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-brand-600 font-semibold hover:underline">
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}