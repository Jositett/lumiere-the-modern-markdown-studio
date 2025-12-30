import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, Github, Mail, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { authClient, twoFactor } from '@/lib/auth-client';
import { toast } from 'sonner';
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [mfaChallenge, setMfaChallenge] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useEditorStore(s => s.setAuth);
  const navigate = useNavigate();
  const handleOAuth = async (provider: 'github' | 'google') => {
    try {
      await authClient.signIn.social({ provider, callbackURL: '/app' });
    } catch (e) {
      toast.error('OAuth sign-in failed');
    }
  };
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = useBackupCode
        ? await twoFactor.verifyBackupCode({ code: mfaCode })
        : await twoFactor.verifyTotp({ code: mfaCode });
      if (error) throw error;
      const session = await authClient.getSession();
      if (session.data?.user) {
        await setAuth(session.data.user as any);
        toast.success("Security verified");
        navigate('/app');
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid security code");
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await authClient.signIn.email({ email, password });
        if (error) {
          if (error.status === 403 && (error as any).code === "TWO_FACTOR_REQUIRED") {
            setMfaChallenge(true);
            return;
          }
          throw error;
        }
        if (data?.user) await setAuth(data.user as any);
      } else {
        const { data, error } = await authClient.signUp.email({ email, password, name });
        if (error) throw error;
        if (data?.user) await setAuth(data.user as any);
      }
      navigate('/app');
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  if (mfaChallenge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-display font-bold">Two-Factor Auth</h2>
            <p className="text-muted-foreground">
              {useBackupCode ? "Enter a backup code" : "Enter code from authenticator app"}
            </p>
          </div>
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <form onSubmit={handleMfaSubmit} className="space-y-6">
                <Input
                  placeholder={useBackupCode ? "ABCDE-12345" : "000000"}
                  className="text-center text-2xl tracking-[0.5em] h-14"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)}
                  required
                />
                <Button className="w-full bg-brand-600 h-12 text-lg rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify Identity
                </Button>
                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="w-full text-xs text-brand-600 hover:underline flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3 h-3" />
                  {useBackupCode ? "Use Authenticator App" : "Use a Backup Code"}
                </button>
              </form>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                )}
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
            <CardFooter className="flex flex-col gap-4">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                <Button variant="outline" className="gap-2 h-12" onClick={() => handleOAuth('github')}><Github className="w-4 h-4" /> Github</Button>
                <Button variant="outline" className="gap-2 h-12" onClick={() => handleOAuth('google')}><Mail className="w-4 h-4" /> Google</Button>
              </div>
            </CardFooter>
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