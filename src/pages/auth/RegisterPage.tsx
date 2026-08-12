import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { useAuthStore } from '@/stores/useAuthStore';
import { Stethoscope, User, Mail, Lock, UserPlus } from 'lucide-react';

export interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { register, loginWithGoogle, isLoading, error } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setPasswordError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    try {
      await register(email, password, fullName);
      onSuccess?.();
    } catch (err) {
      // Handled in store
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper-texture">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-clinical-blue text-white rounded-2xl shadow-subtle">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-vet-text tracking-tight">Vetmind</h1>
          <p className="text-xs text-vet-secondary">Cadastro Profissional para Médicos Veterinários</p>
        </div>

        {/* Register Card */}
        <Card variant="default" padding="lg">
          <CardHeader className="text-center pb-2">
            <CardTitle>Criar Nova Conta</CardTitle>
            <CardDescription>Preencha os dados abaixo para iniciar sua jornada médica</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="p-3 mb-4 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <Input
                label="Nome Completo"
                type="text"
                placeholder="Dr. Eduardo Vasconcelos"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="E-mail Profissional"
                type="email"
                placeholder="veterinario@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirmar Senha"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
                error={passwordError || undefined}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Cadastrar e Acessar
              </Button>
            </form>

            <Divider label="ou cadastrar com" />

            <Button
              type="button"
              variant="secondary"
              className="w-full border-vet-border"
              onClick={handleGoogleLogin}
              isLoading={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google Sign-In
            </Button>
          </CardContent>

          {onSwitchToLogin && (
            <CardFooter className="justify-center border-t-0 pt-0">
              <p className="text-xs text-vet-secondary">
                Já possui uma conta?{' '}
                <button type="button" onClick={onSwitchToLogin} className="font-semibold text-clinical-blue hover:underline">
                  Fazer Login
                </button>
              </p>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};
