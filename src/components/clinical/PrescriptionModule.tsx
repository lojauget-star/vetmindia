import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores/useAuthStore';
import { prescriptionService } from '@/services/prescription.service';
import { prescriptionRepository } from '@/repositories/prescription.repository';
import { Prescription, PrescriptionItemDetailed, AdministrationRoute } from '@/types/prescription.types';
import { Pill, Plus, Trash2, Save, Printer, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface PrescriptionModuleProps {
  caseId: string;
  hypothesisId: string;
  patientId: string;
  originalPatientWeight?: number;
}

export const PrescriptionModule: React.FC<PrescriptionModuleProps> = ({
  caseId,
  hypothesisId,
  patientId,
  originalPatientWeight = 10.0,
}) => {
  const { user } = useAuthStore();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [weightInput, setWeightInput] = useState<number>(originalPatientWeight);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadOrCreatePrescription() {
      if (!user) return;
      setIsLoading(true);
      try {
        let existing = await prescriptionRepository.getPrescriptionByCaseAndHypothesis(caseId, hypothesisId);
        if (!existing) {
          existing = await prescriptionService.generateDraftForHypothesis(caseId, hypothesisId, user.uid);
        }
        setPrescription(existing);
        setWeightInput(existing.weightUsed || originalPatientWeight);
      } catch (err: any) {
        console.error('Failed to load/create prescription:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrCreatePrescription();
  }, [caseId, hypothesisId, user, originalPatientWeight]);

  // Handle Dynamic Weight Recalculation
  const handleWeightChange = (newWeight: number) => {
    setWeightInput(newWeight);
    setSaveSuccess(false);
    if (!prescription || newWeight <= 0) return;

    try {
      const recalculatedItems = prescriptionService.recalculateItemsForNewWeight(prescription.items, newWeight);
      setPrescription({
        ...prescription,
        weightUsed: newWeight,
        items: recalculatedItems,
      });
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err.message);
    }
  };

  // Handle Editing Item Fields
  const handleItemChange = (index: number, field: keyof PrescriptionItemDetailed, value: any) => {
    if (!prescription) return;
    setSaveSuccess(false);
    const updatedItems = [...prescription.items];
    const currentItem = { ...updatedItems[index], [field]: value };

    // Trigger recalculation if dosage/concentration changed
    if (field === 'dosageMgKg' || field === 'concentrationMgMl' || field === 'tabletMg') {
      try {
        const singleRecalc = prescriptionService.recalculateItemsForNewWeight([currentItem], weightInput)[0];
        updatedItems[index] = singleRecalc;
      } catch (err) {
        updatedItems[index] = currentItem;
      }
    } else {
      updatedItems[index] = currentItem;
    }

    setPrescription({ ...prescription, items: updatedItems });
  };

  // Add Item
  const handleAddItem = () => {
    if (!prescription) return;
    setSaveSuccess(false);
    const newItemRaw: PrescriptionItemDetailed = {
      id: `item_${Date.now()}`,
      medicationName: '',
      activeIngredient: '',
      dosageMgKg: 1.0,
      route: 'ORAL',
      frequency: 'A cada 24 horas',
      durationDays: 5,
      calculatedTotalDoseMg: Number((weightInput * 1.0).toFixed(2)),
      instructions: '',
    };
    setPrescription({ ...prescription, items: [...prescription.items, newItemRaw] });
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    if (!prescription) return;
    setSaveSuccess(false);
    const updated = prescription.items.filter((_, i) => i !== index);
    setPrescription({ ...prescription, items: updated });
  };

  // Save Prescription
  const handleSave = async () => {
    if (!user || !prescription) return;
    setIsSaving(true);
    setValidationError(null);
    setSaveSuccess(false);
    try {
      const saved = await prescriptionService.savePrescription(prescription, user.uid);
      setPrescription(saved);
      setSaveSuccess(true);
    } catch (err: any) {
      setValidationError(err.message || 'Erro ao salvar prescrição.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando prescrição determinística para a hipótese..." />;
  }

  if (!prescription) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-vet-surface border border-vet-border rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="w-6 h-6 text-clinical-blue" />
          <div>
            <h3 className="text-base font-bold text-vet-text">Prescrição Médica Veterinária</h3>
            <p className="text-xs text-vet-secondary">
              Cálculo determinístico de doses • Versão {prescription.version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir / Exportar PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Prescrição
          </Button>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="p-3 bg-trusted-green-light/20 border border-trusted-green rounded-lg flex items-center gap-2 text-xs text-trusted-green-dark font-medium">
          <CheckCircle2 className="w-4 h-4 text-trusted-green" />
          Prescrição salva com sucesso no Cloud Firestore!
        </div>
      )}

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          {validationError}
        </div>
      )}

      {/* Weight Customization Section */}
      <Card variant="paper">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-vet-text flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-trusted-green" />
            Parâmetros do Paciente para Cálculo Determinístico
          </CardTitle>
          <Badge variant="neutral" size="sm">Cálculo Matemático Determinístico</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-xs font-semibold text-vet-text block mb-1">
                Peso Utilizado na Prescrição (kg)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={weightInput}
                onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="text-xs text-vet-secondary p-3 bg-vet-bg rounded-lg border border-vet-border-subtle">
              <strong className="text-vet-text">Nota de Segurança:</strong> Ao alterar o peso aqui, as doses de todos os medicamentos são recalculadas imediatamente. O peso original cadastrado no prontuário do paciente ({originalPatientWeight} kg) permanece inalterado.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medication Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-vet-text">Medicamentos Prescritos ({prescription.items.length})</h4>
          <Button variant="ghost" size="sm" onClick={handleAddItem} leftIcon={<Plus className="w-4 h-4" />}>
            Adicionar Medicamento
          </Button>
        </div>

        {prescription.items.map((item, index) => (
          <Card key={item.id} variant="default" className="relative">
            <CardHeader className="flex-row items-center justify-between pb-2">
              <span className="text-xs font-mono font-bold text-clinical-blue bg-clinical-blue-light px-2 py-0.5 rounded">
                Item #{index + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Nome Comercial / Apresentação"
                  value={item.medicationName}
                  onChange={(e) => handleItemChange(index, 'medicationName', e.target.value)}
                  placeholder="Ex: Cerenia"
                />
                <Input
                  label="Princípio Ativo"
                  value={item.activeIngredient}
                  onChange={(e) => handleItemChange(index, 'activeIngredient', e.target.value)}
                  placeholder="Ex: Maropitant Citrato"
                />
                <Input
                  label="Dose Recomendada (mg/kg)"
                  type="number"
                  step="0.1"
                  value={item.dosageMgKg}
                  onChange={(e) => handleItemChange(index, 'dosageMgKg', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  label="Concentração Líquida (mg/mL)"
                  type="number"
                  step="0.1"
                  value={item.concentrationMgMl || ''}
                  onChange={(e) => handleItemChange(index, 'concentrationMgMl', parseFloat(e.target.value) || undefined)}
                  placeholder="Opcional"
                />
                <Input
                  label="Apresentação Comprimido (mg)"
                  type="number"
                  step="1"
                  value={item.tabletMg || ''}
                  onChange={(e) => handleItemChange(index, 'tabletMg', parseFloat(e.target.value) || undefined)}
                  placeholder="Opcional"
                />
                <Select
                  label="Via de Administração"
                  value={item.route}
                  onChange={(e) => handleItemChange(index, 'route', e.target.value as AdministrationRoute)}
                  options={[
                    { value: 'ORAL', label: 'ORAL' },
                    { value: 'SUBCUTANEOUS', label: 'SUBCUTÂNEA (SC)' },
                    { value: 'INTRAVENOUS', label: 'INTRAVENOSA (IV)' },
                    { value: 'INTRAMUSCULAR', label: 'INTRAMUSCULAR (IM)' },
                    { value: 'TOPICAL', label: 'TÓPICA' },
                    { value: 'OPHTHALMIC', label: 'OFTÁLMICA' },
                    { value: 'OTIC', label: 'ÓTICA' },
                  ]}
                />
                <Input
                  label="Duração (Dias)"
                  type="number"
                  value={item.durationDays}
                  onChange={(e) => handleItemChange(index, 'durationDays', parseInt(e.target.value, 10) || 1)}
                />
              </div>

              {/* Calculated Result Preview */}
              <div className="p-3 bg-clinical-blue-light/10 border border-clinical-blue-light rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-clinical-blue">Resultado do Cálculo Determinístico: </span>
                  <span className="text-vet-text">
                    Dose Total: <strong>{item.calculatedTotalDoseMg} mg</strong>
                    {item.calculatedVolumeMl && <> • Volume: <strong>{item.calculatedVolumeMl} mL</strong></>}
                    {item.calculatedTablets && <> • Comprimidos: <strong>{item.calculatedTablets} un</strong></>}
                  </span>
                </div>
              </div>

              <Textarea
                label="Instruções de Posologia e Orientação ao Tutor"
                value={item.instructions}
                onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                placeholder="Ex: Administrar via oral a cada 24 horas por 5 dias."
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
