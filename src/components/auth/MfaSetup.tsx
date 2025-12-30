import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { twoFactor } from '@/lib/auth-client';
import { toast } from 'sonner';
export function MfaSetup() {
  const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'backup'>('initial');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const enableTwoFactor = async () => {
    setLoading(true);
    try {
      const { data, error } = await twoFactor.enable({ password: "" }); // Password may be required by plugin depending on config
      if (error) throw error;
      if (data?.totpURI) {
        setQrCode(data.totpURI);
        setStep('qr');
      }
    } catch (err: any) {
      toast.error(err.message || "Could not initialize MFA");
    } finally {
      setLoading(false);
    }
  };
  const verifyMfa = async () => {
    setLoading(true);
    try {
      const { data, error } = await twoFactor.verifyTotp({ code: verificationCode });
      if (error) throw error;
      // Depending on the version of the plugin, backup codes might be in a different place
      // and enable might complete without backup codes initially
      setStep('backup');
      toast.success("MFA successfully enabled!");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {step === 'initial' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-brand-50 rounded-2xl border border-brand-100">
            <ShieldCheck className="w-8 h-8 text-brand-600" />
            <div>
              <p className="font-bold text-sm">Enhanced Security</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of protection to your library.</p>
            </div>
          </div>
          <Button onClick={enableTwoFactor} disabled={loading} className="w-full bg-brand-600">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Secure My Account
          </Button>
        </div>
      )}
      {step === 'qr' && (
        <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
          <div className="mx-auto p-4 bg-white rounded-3xl border-4 border-brand-50 w-fit">
            <QRCodeSVG value={qrCode} size={200} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold">Scan with your Authenticator</p>
            <p className="text-xs text-muted-foreground">Scan the QR code with Google Authenticator, Authy, or similar apps.</p>
          </div>
          <Button onClick={() => setStep('verify')} className="w-full">
            Next Step
          </Button>
        </div>
      )}
      {step === 'verify' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Verification Code</label>
            <Input
              placeholder="000000"
              className="text-center text-2xl h-14 tracking-widest"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
            />
          </div>
          <Button onClick={verifyMfa} disabled={loading} className="w-full bg-brand-600">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm & Enable
          </Button>
        </div>
      )}
      {step === 'backup' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">Your MFA is now active. Please ensure you have your authenticator app handy for future logins.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            Finished
          </Button>
        </div>
      )}
    </div>
  );
}