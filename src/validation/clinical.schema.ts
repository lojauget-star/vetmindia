import { z } from 'zod';

export const PatientSchema = z.object({
  name: z.string().min(1, 'Nome do paciente é obrigatório.'),
  species: z.enum(['CANINE', 'FELINE', 'EQUINE', 'EXOTIC', 'OTHER']),
  breed: z.string().min(1, 'Raça é obrigatória.'),
  gender: z.enum(['MALE_INTACT', 'MALE_NEUTERED', 'FEMALE_INTACT', 'FEMALE_SPAYED']),
  ageYears: z.number().min(0, 'Idade em anos inválida.'),
  ageMonths: z.number().min(0).max(11, 'Idade em meses deve ser entre 0 e 11.'),
  weightKg: z.number().positive('Peso deve ser maior que zero.'),
  tutorName: z.string().min(1, 'Nome do tutor é obrigatório.'),
  tutorContact: z.string().min(1, 'Contato do tutor é obrigatório.'),
  microchipId: z.string().optional(),
});

export const ClinicalCaseSchema = z.object({
  patientId: z.string().min(1, 'Paciente associado é obrigatório.'),
  title: z.string().min(1, 'Título do caso é obrigatório.'),
  chiefComplaint: z.string().min(5, 'Queixa principal deve conter no mínimo 5 caracteres.'),
  tags: z.array(z.string()).optional(),
});

export type PatientInput = z.infer<typeof PatientSchema>;
export type ClinicalCaseInput = z.infer<typeof ClinicalCaseSchema>;
