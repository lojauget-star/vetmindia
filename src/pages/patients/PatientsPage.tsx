import React, { useState, useEffect, useCallback } from 'react';
import { patientRepository } from '@/repositories/patient.repository';
import { useAuthStore } from '@/stores/useAuthStore';
import { Patient, Species, Gender } from '@/types/clinical.types';
import { PatientSchema } from '@/validation/clinical.schema';
import { PatientHeader } from '@/components/clinical/PatientHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PlusCircle, Search, Trash2, Edit3, FolderOpen } from 'lucide-react';

export interface PatientsPageProps {
  onSelectPatient: (patientId: string) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({ onSelectPatient }) => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('CANINE');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState<Gender>('MALE_NEUTERED');
  const [ageYears, setAgeYears] = useState(3);
  const [ageMonths, setAgeMonths] = useState(0);
  const [weightKg, setWeightKg] = useState(10);
  const [tutorName, setTutorName] = useState('');
  const [tutorContact, setTutorContact] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientRepository.getPatientsByUser(user.uid);
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar pacientes.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleOpenCreateModal = () => {
    setEditingPatient(null);
    setName('');
    setSpecies('CANINE');
    setBreed('');
    setGender('MALE_NEUTERED');
    setAgeYears(3);
    setAgeMonths(0);
    setWeightKg(10);
    setTutorName('');
    setTutorContact('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Patient) => {
    setEditingPatient(p);
    setName(p.name);
    setSpecies(p.species);
    setBreed(p.breed);
    setGender(p.gender);
    setAgeYears(p.ageYears);
    setAgeMonths(p.ageMonths);
    setWeightKg(p.weightKg);
    setTutorName(p.tutorName);
    setTutorContact(p.tutorContact);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    const payload = {
      name,
      species,
      breed,
      gender,
      ageYears: Number(ageYears),
      ageMonths: Number(ageMonths),
      weightKg: Number(weightKg),
      tutorName,
      tutorContact,
    };

    const validation = PatientSchema.safeParse(payload);
    if (!validation.success) {
      setFormError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      if (editingPatient) {
        await patientRepository.updatePatient(editingPatient.id, {
          ...payload,
          updatedAt: now,
        });
      } else {
        const newId = `pat_${Date.now()}`;
        await patientRepository.createPatient({
          id: newId,
          userId: user.uid,
          ownerId: user.uid,
          ...payload,
          createdAt: now,
          updatedAt: now,
        });
      }
      setIsModalOpen(false);
      await fetchPatients();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao gravar dados do paciente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    if (!user || !window.confirm('Tem certeza que deseja excluir este paciente?')) return;
    try {
      await patientRepository.deletePatient(patientId, user.uid);
      await fetchPatients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tutorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingState message="Carregando pacientes cadastrados no Firebase..." size="lg" />;
  }

  if (error) {
    return <ErrorState title="Erro ao Carregar Pacientes" message={error} onRetry={fetchPatients} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-vet-border">
        <div>
          <h1 className="text-2xl font-bold text-vet-text tracking-tight">Pacientes</h1>
          <p className="text-xs text-vet-secondary">Gerencie os prontuários e históricos dos animais atendidos</p>
        </div>

        <Button variant="primary" onClick={handleOpenCreateModal} leftIcon={<PlusCircle className="w-4 h-4" />}>
          Novo Paciente
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <SearchInput
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          placeholder="Buscar por paciente, raça ou tutor..."
        />
      </div>

      {/* Patient List */}
      {filteredPatients.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          description={
            searchQuery
              ? 'Tente alterar os termos da busca.'
              : 'Cadastre o primeiro paciente para associar casos clínicos.'
          }
          action={
            !searchQuery && (
              <Button variant="primary" onClick={handleOpenCreateModal} leftIcon={<PlusCircle className="w-4 h-4" />}>
                Cadastrar Paciente
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((p) => (
            <div key={p.id} className="relative group">
              <div
                onClick={() => onSelectPatient(p.id)}
                className="cursor-pointer transition-transform group-hover:translate-y-[-2px]"
              >
                <PatientHeader patient={p} />
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-vet-surface/90 backdrop-blur-xs p-1 rounded-lg border border-vet-border shadow-subtle opacity-90 group-hover:opacity-100">
                <button
                  onClick={() => onSelectPatient(p.id)}
                  className="p-1 text-clinical-blue hover:bg-clinical-blue-light rounded"
                  title="Abrir Paciente"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEditModal(p)}
                  className="p-1 text-vet-secondary hover:text-vet-text hover:bg-vet-surface-subtle rounded"
                  title="Editar Paciente"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Excluir Paciente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar / Editar Paciente */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
        description="Preencha as informações médicas básicas do paciente."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Nome do Paciente *"
            placeholder="Ex: Thor, Rex, Mia"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Espécie *"
              value={species}
              onChange={(e) => setSpecies(e.target.value as Species)}
              options={[
                { value: 'CANINE', label: 'Cão (Canina)' },
                { value: 'FELINE', label: 'Gato (Felina)' },
                { value: 'EQUINE', label: 'Cavalo (Equina)' },
                { value: 'EXOTIC', label: 'Exótico' },
                { value: 'OTHER', label: 'Outro' },
              ]}
            />

            <Input
              label="Raça *"
              placeholder="Ex: Golden Retriever"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Idade (Anos) *"
              type="number"
              value={ageYears}
              onChange={(e) => setAgeYears(Number(e.target.value))}
              required
            />
            <Input
              label="Idade (Meses) *"
              type="number"
              value={ageMonths}
              onChange={(e) => setAgeMonths(Number(e.target.value))}
              required
            />
            <Input
              label="Peso (kg) *"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome do Tutor *"
              placeholder="Ex: Carlos Silva"
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              required
            />
            <Input
              label="Contato do Tutor *"
              placeholder="Ex: (11) 98888-7777"
              value={tutorContact}
              onChange={(e) => setTutorContact(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
