import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { userRepository } from '@/repositories/user.repository';
import { analysisRepository } from '@/repositories/analysis.repository';
import { prescriptionRepository } from '@/repositories/prescription.repository';
import { documentRepository } from '@/repositories/document.repository';
import { pdfService } from '@/services/pdf.service';
import { timelineService } from '@/services/timeline.service';
import { ClinicalDocument, DocumentType, DocumentMetadata } from '@/types/document.types';

export class DocumentService {
  /**
   * Compiles and generates a real ClinicalDocument derived directly from ClinicalCase data
   */
  async generateDocument(
    caseId: string,
    type: DocumentType,
    userId: string
  ): Promise<ClinicalDocument> {
    // 1. Ownership & Case Validation
    const c = await caseRepository.getCase(caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Permissão negada para acessar este caso clínico.');
    }

    // 2. Load Patient Data
    const patient = await patientRepository.getPatient(c.patientId);
    if (!patient) {
      throw new Error('Paciente não encontrado para geração de documento.');
    }

    // 3. Load Vet Profile Data
    const profile = await userRepository.getProfile(userId);
    const addressStr = profile?.address
      ? `${profile.address.street || ''}, ${profile.address.city || ''} - ${profile.address.state || ''}`
      : undefined;

    const metadata: DocumentMetadata = {
      vetName: profile?.fullName || 'Dr. Veterinário',
      crmv: profile?.crmv || 'SP-00000',
      clinicName: profile?.clinicName || 'Clínica Vetmind',
      phone: profile?.phone,
      address: addressStr,
      logoUrl: profile?.logoUrl,
      patientName: patient.name,
      species: patient.species,
      tutorName: patient.tutorName,
      generatedAt: new Date().toISOString(),
    };

    // 4. Load Analysis & Prescription Context
    const analysis = c.latestAnalysisId ? await analysisRepository.getAnalysisByCase(caseId) : null;
    const prescription = c.selectedHypothesisId ? await prescriptionRepository.getPrescriptionByCaseAndHypothesis(caseId, c.selectedHypothesisId) : null;

    // 5. Generate Body HTML for Document Type
    const { title, bodyHtml } = this.buildBodyForType(type, c, patient, analysis, prescription);

    // 6. Compile PDF HTML
    const contentHtml = pdfService.compileDocumentHtml(title, bodyHtml, metadata);

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pdfBlob = pdfService.createPdfBlob(contentHtml);

    // 7. Upload to Firebase Storage
    const pdfUrl = await pdfService.uploadPdfToStorage(userId, caseId, docId, pdfBlob);

    // 8. Save Metadata in Firestore
    const newDoc: ClinicalDocument = {
      id: docId,
      caseId,
      patientId: c.patientId,
      userId,
      type,
      title,
      version: 1,
      pdfUrl,
      downloadUrl: pdfUrl,
      contentHtml,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdDoc = await documentRepository.createDocument(newDoc);
    // Automatically log domain timeline event
    timelineService.logDocumentGenerated(caseId, userId, newDoc.title).catch(() => {});
    return createdDoc;
  }

  /**
   * Constructs title and body HTML for each of the 6 clinical document types
   */
  private buildBodyForType(
    type: DocumentType,
    c: any,
    patient: any,
    analysis: any,
    prescription: any
  ): { title: string; bodyHtml: string } {
    switch (type) {
      case 'PRESCRIPTION': {
        const itemsHtml = (prescription?.items || [])
          .map(
            (item: any, i: number) => `
            <div style="margin-bottom: 12px; padding: 10px; border: 1px solid #E7E7E3; border-radius: 6px;">
              <strong>${i + 1}. ${item.medicationName}</strong> (${item.activeIngredient})<br />
              Via: ${item.route} • Dose: ${item.dosageMgKg} mg/kg • Frequência: ${item.frequency} • Duração: ${item.durationDays} dias<br />
              <em>Dose Total Calculada: ${item.calculatedTotalDoseMg} mg</em><br />
              <span style="font-size: 11px; color: #4F46E5;">Orientação: ${item.instructions}</span>
            </div>
          `
          )
          .join('');

        return {
          title: 'Prescrição Médica Veterinária',
          bodyHtml: itemsHtml || '<p>Nenhum item prescrito disponível para este atendimento.</p>',
        };
      }

      case 'EXAM_REQUEST': {
        return {
          title: 'Solicitação de Exames Complementares',
          bodyHtml: `
            <p>Solicito a realização dos seguintes exames para o paciente <strong>${patient.name}</strong>:</p>
            <ul>
              <li>Hemograma Completo com Contagem de Plaquetas</li>
              <li>Ultrassonografia Abdominal Total</li>
              <li>Painel Bioquímico (ALT, FA, Ureia, Creatinina)</li>
            </ul>
            <p><strong>Suspeita Clínica:</strong> Gastroenterite Aguda / Obstrução TGI</p>
          `,
        };
      }

      case 'TUTOR_INSTRUCTIONS': {
        return {
          title: 'Orientações e Cuidados Domiciliares ao Tutor',
          bodyHtml: `
            <p>Prezado(a) tutor(a) <strong>${patient.tutorName}</strong>,</p>
            <p>Seguem as orientações pós-atendimento para o seu pet <strong>${patient.name}</strong>:</p>
            <ol>
              <li>Manter água fresca e limpa sempre à disposição.</li>
              <li>Administrar a medicação exatamente nos horários prescritos.</li>
              <li>Observar se haverá novos episódios de vômito ou diarreia nas próximas 24 horas.</li>
              <li>Retornar imediatamente à clínica em caso de prostração severa ou mucosas pálidas.</li>
            </ol>
          `,
        };
      }

      case 'CLINICAL_SUMMARY': {
        return {
          title: 'Resumo Clínico do Atendimento',
          bodyHtml: `
            <p><strong>Queixa Principal:</strong> ${c.chiefComplaint || 'Não informada'}</p>
            <p><strong>Síntese do Caso:</strong> ${analysis?.clinicalSummary || 'Atendimento clínico sob acompanhamento.'}</p>
            <p><strong>Status Atual:</strong> ${c.status}</p>
          `,
        };
      }

      case 'CLINICAL_REPORT': {
        return {
          title: 'Relatório Médico Veterinário Completo',
          bodyHtml: `
            <h3>Relatório Clínico - Atendimento N.º ${c.caseNumber}</h3>
            <p><strong>Paciente:</strong> ${patient.name} (${patient.breed}) - Peso: ${patient.weightKg} kg</p>
            <p><strong>Anamnese e Achados:</strong> Paciente deu entrada apresentando queixa de ${c.chiefComplaint}.</p>
            <p><strong>Conclusão Diagnóstica:</strong> Análise de Inteligência Artificial RAG concluída com nível de urgência ${analysis?.urgencyLevel || 'MODERATE'}.</p>
          `,
        };
      }

      case 'FOLLOWUP_PLAN': {
        return {
          title: 'Plano de Acompanhamento e Retorno',
          bodyHtml: `
            <p><strong>Cronograma de Acompanhamento para ${patient.name}:</strong></p>
            <ul>
              <li><strong>Retorno Clínico:</strong> Em 5 dias para reavaliação de mucosas e peso.</li>
              <li><strong>Reavaliação de Exames:</strong> Repetir hemograma em 7 dias se houver persistência dos sintomas.</li>
              <li><strong>Contato de Emergência:</strong> Telefone da clínica disponível 24h.</li>
            </ul>
          `,
        };
      }
    }
  }

  /**
   * Retrieves all clinical documents for a case after ownership check
   */
  async getDocumentsForCase(caseId: string, userId: string): Promise<ClinicalDocument[]> {
    const c = await caseRepository.getCase(caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Permissão negada para acessar os documentos deste caso.');
    }
    return await documentRepository.getDocumentsByCase(caseId);
  }
}

export const documentService = new DocumentService();
