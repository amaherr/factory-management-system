import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { demoConfig } from '../config/demo';
import { toast } from 'sonner';
import { Factory, Phone, Lock } from 'lucide-react';

export function Login() {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const showDemoNotice = demoConfig.isDemo && (demoConfig.recruiterPhone || demoConfig.recruiterPin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(phone, pin);
      toast.success(t('welcome back message'));
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('invalid credentials');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Factory className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{t('welcome back')}</CardTitle>
          <CardDescription>{t('enter your credentials')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {showDemoNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                <p className="font-semibold">{t('demo recruiter title')}</p>
                <p className="mt-1 text-amber-900">{t('demo recruiter description')}</p>
                <div className="mt-3 space-y-1 font-mono text-xs">
                  {demoConfig.recruiterPhone && (
                    <p>
                      {t('demo phone label')}: {demoConfig.recruiterPhone}
                    </p>
                  )}
                  {demoConfig.recruiterPin && (
                    <p>
                      {t('demo pin label')}: {demoConfig.recruiterPin}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone number')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">{t('pin code')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-9 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full font-semibold shadow-sm hover:shadow-md transition-all duration-200"
              disabled={loading}
            >
              {loading ? t('signing in') : t('sign in')}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>{t('protected system')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
