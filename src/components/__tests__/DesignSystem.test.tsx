import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import {
  Button,
  Badge,
  Card,
  Input,
  Tabs,
  Modal,
  Drawer,
  Toast,
  Progress,
  Avatar,
  EmptyState,
  ErrorState,
  LoadingState,
  Divider,
} from '../ui';

import {
  PatientHeader,
  CaseStatus,
  EvidenceBadge,
  HypothesisCard,
  EvidenceCard,
  ClinicalMetric,
  DocumentCard,
} from '../clinical';

import { Patient, Hypothesis, Evidence } from '@/types/clinical.types';

describe('Vetmind Design System - Core UI Components', () => {
  it('renders Button component with label and handles click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Salvar Caso</Button>);
    const btn = screen.getByRole('button', { name: /salvar caso/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Badge component with correct variant', () => {
    render(<Badge variant="clinical">Diagnóstico</Badge>);
    expect(screen.getByText(/diagnóstico/i)).toBeInTheDocument();
  });

  it('renders Input component with label and error', () => {
    render(<Input label="Nome do Paciente" error="Campo obrigatório" />);
    expect(screen.getByLabelText(/nome do paciente/i)).toBeInTheDocument();
    expect(screen.getByText(/campo obrigatório/i)).toBeInTheDocument();
  });

  it('renders Tabs navigation component', () => {
    const tabs = [
      { id: 'anamnesis', label: 'Anamnese' },
      { id: 'hypotheses', label: 'Hipóteses' },
    ];
    const handleChange = vi.fn();
    render(<Tabs tabs={tabs} activeTab="anamnesis" onChange={handleChange} />);
    expect(screen.getByText(/anamnese/i)).toBeInTheDocument();
    expect(screen.getByText(/hipóteses/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/hipóteses/i));
    expect(handleChange).toHaveBeenCalledWith('hypotheses');
  });

  it('renders ClinicalMetric component with value and unit', () => {
    render(<ClinicalMetric label="Frequência Cardíaca" value={120} unit="bpm" referenceRange="70-140" />);
    expect(screen.getByText(/frequência cardíaca/i)).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
    expect(screen.getByText(/bpm/)).toBeInTheDocument();
  });
});

describe('Vetmind Design System - Clinical Components', () => {
  const mockPatient: Patient = {
    id: 'pat_01',
    userId: 'user_01',
    name: 'Thor',
    species: 'CANINE',
    breed: 'Golden Retriever',
    ageYears: 4,
    ageMonths: 2,
    gender: 'MALE_NEUTERED',
    weightKg: 32.5,
    tutorName: 'Carlos Silva',
    tutorContact: '(11) 98888-7777',
    createdAt: '2026-08-11T00:00:00Z',
    updatedAt: '2026-08-11T00:00:00Z',
  };

  it('renders PatientHeader with patient details', () => {
    render(<PatientHeader patient={mockPatient} />);
    expect(screen.getByText('Thor')).toBeInTheDocument();
    expect(screen.getByText('Cão')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText(/Carlos Silva/)).toBeInTheDocument();
  });

  it('renders CaseStatus badge correctly', () => {
    render(<CaseStatus status="ANALYZING" />);
    expect(screen.getByText('Em Análise (IA)')).toBeInTheDocument();
  });

  it('renders EvidenceBadge with rounded RAG percentage', () => {
    render(<EvidenceBadge score={0.92} />);
    expect(screen.getByText(/Evidência RAG: 92%/)).toBeInTheDocument();
  });

  it('renders HypothesisCard and triggers onSelect', () => {
    const mockHypothesis: Hypothesis = {
      id: 'hyp_01',
      analysisId: 'an_01',
      caseId: 'case_01',
      userId: 'user_01',
      diseaseName: 'Pancreatite Aguda',
      probabilityScore: 0.85,
      reasoning: 'Compatível com dor abdominal cranial e vômitos.',
      supportingFindings: ['Dor abdominal', 'Vômito bilioso'],
      contradictingFindings: [],
      recommendedExams: ['cPLI', 'Ultrassom Abdominal'],
      isSelected: false,
      createdAt: '2026-08-11T00:00:00Z',
    };
    const handleSelect = vi.fn();
    render(<HypothesisCard hypothesis={mockHypothesis} onSelect={handleSelect} />);
    expect(screen.getByText('Pancreatite Aguda')).toBeInTheDocument();
    expect(screen.getByText('85% Probabilidade')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /selecionar conduta/i }));
    expect(handleSelect).toHaveBeenCalledWith('hyp_01');
  });
});
