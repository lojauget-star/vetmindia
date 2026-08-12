import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserProfile } from '@/types/auth.types';
import { User, Award, Building, Phone, Mail, MapPin, Image as ImageIcon, Save, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { profile, saveProfile, logout, isLoading, error } = useAuthStore();
  const [toastVisible, setToastVisible] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '',
    crmv: '',
    clinicName: '',
    phone: '',
    email: '',
    logoUrl: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        crmv: profile.crmv || '',
        clinicName: profile.clinicName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        logoUrl: profile.logoUrl || '',
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          zipCode: profile.address?.zipCode || '',
        },
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const payload: UserProfile = {
      ...profile,
      fullName: formData.fullName || profile.fullName,
      crmv: formData.crmv || '',
      clinicName: formData.clinicName || '',
      phone: formData.phone || '',
      email: profile.email, // Kept synced with Auth
      logoUrl: formData.logoUrl || '',
      address: {
        street: formData.address?.street || '',
        city: formData.address?.city || '',
        state: formData.address?.state || '',
        zipCode: formData.address?.zipCode || '',
      },
      updatedAt: new Date().toISOString(),
    };

    // Flow: UI -> State -> Service -> Repository -> Firestore -> Response -> State -> UI
    await saveProfile(payload);
    setToastVisible(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-vet-border">
        <div className="flex items-center gap-4">
          <Avatar name={formData.fullName || 'Veterinário'} src={formData.logoUrl} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-vet-text">{formData.fullName || 'Médico Veterinário'}</h1>
            <p className="text-xs text-vet-secondary">
              {formData.clinicName ? `${formData.clinicName} • ` : ''}CRMV: {formData.crmv || 'Não informado'}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => logout()} leftIcon={<LogOut className="w-4 h-4" />}>
          Sair da Conta
        </Button>
      </div>

      {/* Main Profile Form Card */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Minha Conta - Perfil do Veterinário</CardTitle>
          <CardDescription>
            Estes dados serão utilizados oficialmente em laudos clínicos, prontuários exportados e prescrições em PDF.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* General Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome Completo *"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="CRMV / Licença Médica *"
                placeholder="CRMV-SP 12345"
                value={formData.crmv}
                onChange={(e) => handleChange('crmv', e.target.value)}
                leftIcon={<Award className="w-4 h-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome da Clínica / Hospital"
                placeholder="Hospital Veterinário Vetmind"
                value={formData.clinicName}
                onChange={(e) => handleChange('clinicName', e.target.value)}
                leftIcon={<Building className="w-4 h-4" />}
              />

              <Input
                label="Telefone Profissional"
                placeholder="(11) 99999-8888"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="E-mail (Identificador Autenticado)"
                value={formData.email}
                leftIcon={<Mail className="w-4 h-4" />}
                disabled
                helperText="Gerenciado via Firebase Authentication"
              />

              <Input
                label="URL da Logo / Fotografia"
                placeholder="https://suaclinica.com/logo.png"
                value={formData.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                leftIcon={<ImageIcon className="w-4 h-4" />}
                helperText="Utilizado no cabeçalho das prescrições em PDF"
              />
            </div>

            {/* Address Info */}
            <div className="pt-4 border-t border-vet-border-subtle space-y-4">
              <h4 className="text-xs font-semibold text-vet-secondary uppercase tracking-wider">
                Endereço da Clínica
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Logradouro / Rua"
                    placeholder="Av. Paulista, 1000 - Sala 42"
                    value={formData.address?.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                </div>

                <Input
                  label="CEP"
                  placeholder="01310-100"
                  value={formData.address?.zipCode}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  placeholder="São Paulo"
                  value={formData.address?.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                />

                <Input
                  label="Estado (UF)"
                  placeholder="SP"
                  value={formData.address?.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-end">
            <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
              Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Toast
        type="success"
        title="Perfil Atualizado com Sucesso!"
        message="Os dados do seu perfil foram sincronizados no Cloud Firestore."
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  );
};
