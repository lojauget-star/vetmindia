import React, { useEffect, useState } from 'react';
import { useAuthStore } from './stores/useAuthStore';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/auth/ProfilePage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { CasesPage } from './pages/cases/CasesPage';
import { CaseDetailPage } from './pages/cases/CaseDetailPage';
import { MarketingPage } from './pages/marketing/MarketingPage';
import { ClinicalLayout } from './components/layout/ClinicalLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { NavItemId } from './components/layout/Sidebar';
import { Modal } from './components/ui/Modal';
import { Input } from './components/ui/Input';
import { Textarea } from './components/ui/Textarea';
import { Select } from './components/ui/Select';
import { Button } from './components/ui/Button';
import { caseRepository } from './repositories/case.repository';
import { patientRepository } from './repositories/patient.repository';
import { ClinicalCase, Patient, Species } from './types/clinical.types';
import { PlusCircle } from 'lucide-react';

export function App() {
  const { initAuthListener, isAuthenticated, isLoading, user } = useAuthStore();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<NavItemId>('dashboard');

  // Selected Detail Views State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Modal State for "Novo Caso" Action
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [species, setSpecies] = useState<Species>('CANINE');
  const [breed, setBreed] = useState('');
  const [tutorName, setTutorName] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientName || !chiefComplaint) return;

    setIsCreatingCase(true);
    try {
      const now = new Date().toISOString();
      const patientId = `pat_${Date.now()}`;
      const caseId = `case_${Date.now()}`;

      // 1. Create Patient in Firestore
      const newPatient: Patient = {
        id: patientId,
        userId: user.uid,
        ownerId: user.uid,
        name: patientName,
        species,
        breed: breed || 'Misto',
        ageYears: 3,
        ageMonths: 0,
        gender: 'MALE_NEUTERED',
        weightKg: 10.0,
        tutorName: tutorName || 'Tutor Responsável',
        tutorContact: '(11) 99999-9999',
        createdAt: now,
        updatedAt: now,
      };
      await patientRepository.createPatient(newPatient);

      // 2. Create ClinicalCase in Firestore
      const newCase: ClinicalCase = {
        id: caseId,
        userId: user.uid,
        ownerId: user.uid,
        patientId,
        caseNumber: `CAS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ANAMNESIS_PENDING',
        title: `Consulta: ${patientName} (${species})`,
        chiefComplaint,
        currentVersion: 1,
        version: 1,
        tags: [species, 'Triagem'],
        createdAt: now,
        updatedAt: now,
      };
      await caseRepository.createCase(newCase);

      // Reset Modal & Navigate to Created Case
      setPatientName('');
      setBreed('');
      setTutorName('');
      setChiefComplaint('');
      setIsNewCaseModalOpen(false);

      setSelectedCaseId(caseId);
      setActiveTab('cases');
    } catch (err) {
      console.error('Failed to create new clinical case:', err);
    } finally {
      setIsCreatingCase(false);
    }
  };

  const handleNavigation = (id: NavItemId) => {
    if (id === 'newCase') {
      setIsNewCaseModalOpen(true);
    } else {
      setSelectedPatientId(null);
      setSelectedCaseId(null);
      setActiveTab(id);
    }
  };

  if (!isAuthenticated && !isLoading) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  return (
    <ProtectedRoute>
      <ClinicalLayout activeItem={activeTab} onNavigate={handleNavigation}>
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNewCase={() => setIsNewCaseModalOpen(true)}
            onNavigateToCases={() => handleNavigation('cases')}
            onNavigateToPatients={() => handleNavigation('patients')}
          />
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          selectedPatientId ? (
            <PatientDetailPage
              patientId={selectedPatientId}
              onBack={() => setSelectedPatientId(null)}
              onSelectCase={(caseId) => {
                setSelectedCaseId(caseId);
                setActiveTab('cases');
              }}
              onCreateCaseForPatient={() => setIsNewCaseModalOpen(true)}
            />
          ) : (
            <PatientsPage
              onSelectPatient={(patientId) => setSelectedPatientId(patientId)}
            />
          )
        )}

        {/* Cases Tab */}
        {activeTab === 'cases' && (
          selectedCaseId ? (
            <CaseDetailPage
              caseId={selectedCaseId}
              onBack={() => setSelectedCaseId(null)}
            />
          ) : (
            <CasesPage
              onSelectCase={(caseId) => setSelectedCaseId(caseId)}
              onNewCase={() => setIsNewCaseModalOpen(true)}
            />
          )
        )}

        {/* Marketing Studio Tab */}
        {activeTab === 'marketing' && <MarketingPage />}

        {/* Profile Page Tab */}
        {activeTab === 'account' && <ProfilePage />}

        {/* Other Placeholder Views */}
        {(activeTab === 'literature' ||
          activeTab === 'tools' ||
          activeTab === 'settings') && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-vet-text capitalize">{activeTab}</h2>
            <DashboardPage
              onNewCase={() => setIsNewCaseModalOpen(true)}
              onNavigateToCases={() => handleNavigation('cases')}
              onNavigateToPatients={() => handleNavigation('patients')}
            />
          </div>
        )}

        {/* Modal: Novo Caso Clínico */}
        <Modal
          isOpen={isNewCaseModalOpen}
          onClose={() => setIsNewCaseModalOpen(false)}
          title="Novo Caso Clínico"
          description="Cadastre as informações iniciais do paciente e a queixa principal para iniciar o atendimento."
        >
          <form onSubmit={handleCreateCase} className="space-y-4">
            <Input
              label="Nome do Paciente *"
              placeholder="Ex: Thor, Rex, Mia"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
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
                label="Raça"
                placeholder="Ex: Golden Retriever"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
              />
            </div>

            <Input
              label="Nome do Tutor Responsável"
              placeholder="Ex: Carlos Silva"
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
            />

            <Textarea
              label="Queixa Principal / Histórico Inicial *"
              placeholder="Descreva os sintomas relatados pelo tutor, início e evolução..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              required
              rows={4}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsNewCaseModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isCreatingCase}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Gravar no Firestore e Iniciar Atendimento
              </Button>
            </div>
          </form>
        </Modal>
      </ClinicalLayout>
    </ProtectedRoute>
  );
}

export default App;
