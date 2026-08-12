import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/useAuthStore';
import { Mail, CheckCircle2 } from 'lucide-react';

export interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { sendPasswordReset, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await sendPasswordReset(email);
      setIsSuccess(true);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSuccess(false);
    clearError();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recuperação de Senha"
      description="Informe seu e-mail cadastrado para receber as instruções de redefinição de acesso."
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center p-4 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-trusted-green" />
          <h4 className="text-base font-bold text-vet-text">E-mail Enviado com Sucesso!</h4>
          <p className="text-xs text-vet-secondary">
            Verifique sua caixa de entrada no e-mail <strong className="text-vet-text">{email}</strong> e siga os passos indicados.
          </p>
          <Button variant="primary" onClick={handleClose} className="mt-2">
            Entendido
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail Cadastrado"
            type="email"
            placeholder="seu.email@vetclinic.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            error={error || undefined}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Enviar E-mail de Recuperação
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
