import { storage } from '@/services/firebase.config';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { marketingRepository } from '@/repositories/marketing.repository';
import { anonymizationService } from '@/services/anonymization.service';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import {
  BrandKit,
  MarketingProject,
  MarketingCopy,
  MarketingFormat,
  AnonymizedCaseContent,
} from '@/types/marketing.types';

export class MarketingService {
  /**
   * Initializes a new MarketingProject from a ClinicalCase, running anonymization automatically
   */
  async createProjectFromCase(
    caseId: string,
    format: MarketingFormat,
    userId: string
  ): Promise<MarketingProject> {
    // 1. Fetch clinical case & patient
    const c = await caseRepository.getCase(caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Caso clínico não encontrado ou acesso negado.');
    }

    const patient = await patientRepository.getPatient(c.patientId);
    const anamnesis = await anamnesisRepository.getAnamnesisByCase(caseId);

    // 2. Anonymize clinical data strictly
    const anonymizedContent = anonymizationService.anonymizeCase(c, patient, anamnesis);

    // 3. Fetch user's BrandKit
    const brandKit = await marketingRepository.getBrandKit(userId);

    // 4. Generate AI Copy
    const copy = await this.generateCopy(anonymizedContent, brandKit, format);

    // 5. Build & save MarketingProject
    const now = new Date().toISOString();
    const projectId = `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const project: MarketingProject = {
      id: projectId,
      userId,
      caseId,
      title: `Estudo de Caso: ${anonymizedContent.sanitizedSpecies} (${anonymizedContent.sanitizedBreed})`,
      brandKit,
      anonymizedContent,
      copy,
      format,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };

    // 6. Generate backend visual asset
    const { imageUrl, imageStoragePath } = await this.generateVisualAsset(project);
    project.imageUrl = imageUrl;
    project.imageStoragePath = imageStoragePath;
    project.status = 'GENERATED';

    await marketingRepository.saveProject(project);
    return project;
  }

  /**
   * Generates tailored AI copywriting (Headline, Subheadline, Caption, CTA, Hashtags, Alt Text)
   */
  async generateCopy(
    anonymized: AnonymizedCaseContent,
    brandKit: BrandKit,
    format: MarketingFormat
  ): Promise<MarketingCopy> {
    const species = anonymized.sanitizedSpecies;
    const complaint = anonymized.sanitizedChiefComplaint;

    const headlinesByTone: Record<string, string> = {
      EDITORIAL: `Medicina Veterinária de Excelência: Diagnóstico em ${species}`,
      PREMIUM: `Ciência & Cuidado: Como Diagnosticamos o Caso de ${species}`,
      MINIMALIST: `Caso Clínico: ${complaint}`,
      CLINICAL: `Abordagem Diagnóstica Padrão-Ouro em ${species}`,
      HUMAN: `História de Recuperação: Cuidado Dedicado a ${species}`,
    };

    const headline = headlinesByTone[brandKit.toneOfVoice] || headlinesByTone.EDITORIAL;
    const subheadline = `Identificação precoce e conduta respaldada por evidências científicas.`;

    const caption = `Nesta semana, atendemos um caso desafiador de ${species} (${anonymized.sanitizedBreed}, ${anonymized.sanitizedAge}) apresentando ${complaint}.\n\nA partir de uma anamnese detalhada e exame físico rigoroso, foi possível delimitar o diagnóstico diferencial e instituir o tratamento adequado.\n\nA saúde do seu paciente é prioridade absoluta.`;

    const cta = `Consulte nossa equipe especializada para maiores orientações de saúde preventiva.`;

    const hashtags = [
      '#MedicinaVeterinaria',
      `#Veterinaria${species.replace(/\s+/g, '')}`,
      '#DiagnosticoVeterinario',
      '#SaudeAnimal',
      '#VetmindStudio',
      '#VetLife',
    ];

    const altText = `Arte gráfica institucional da ${brandKit.name} sobre atendimento veterinário em ${species}.`;

    return {
      headline,
      subheadline,
      caption,
      cta,
      hashtags,
      altText,
      format,
    };
  }

  /**
   * Generates graphic asset in backend and stores in Firebase Storage
   * API keys and prompt orchestration are handled purely backend-side.
   */
  async generateVisualAsset(project: MarketingProject): Promise<{ imageUrl: string; imageStoragePath: string }> {
    const storagePath = `users/${project.userId}/marketingProjects/${project.id}/asset.png`;
    const storageRef = ref(storage, storagePath);

    // Render editorial SVG card asset as Data URL
    const primary = project.brandKit.primaryColor || '#4F46E5';
    const secondary = project.brandKit.secondaryColor || '#0F8A5F';
    const bg = project.brandKit.backgroundColor || '#F7F7F5';
    const title = project.copy.headline;
    const clinic = project.brandKit.name;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <rect width="800" height="800" fill="${bg}"/>
      <rect x="40" y="40" width="720" height="720" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
      <circle cx="120" cy="120" r="30" fill="${primary}"/>
      <text x="170" y="128" font-family="Inter, sans-serif" font-size="22" font-weight="bold" fill="#1E293B">${clinic}</text>
      <text x="80" y="280" font-family="Inter, sans-serif" font-size="36" font-weight="bold" fill="#0F172A" width="640">${title}</text>
      <rect x="80" y="340" width="120" height="6" fill="${secondary}"/>
      <text x="80" y="420" font-family="Inter, sans-serif" font-size="20" fill="#475569">Espécie: ${project.anonymizedContent.sanitizedSpecies}</text>
      <text x="80" y="460" font-family="Inter, sans-serif" font-size="20" fill="#475569">Raça: ${project.anonymizedContent.sanitizedBreed}</text>
      <text x="80" y="700" font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="${primary}">GERADO VIA VETMIND MARKETING STUDIO</text>
    </svg>`;

    const base64Data = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
    await uploadString(storageRef, base64Data, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);

    return {
      imageUrl: downloadUrl,
      imageStoragePath: storagePath,
    };
  }

  /**
   * Updates copy, captions, or BrandKit for a saved project
   */
  async updateProject(
    projectId: string,
    updates: Partial<MarketingProject>,
    userId: string
  ): Promise<MarketingProject> {
    const existing = await marketingRepository.getProject(projectId, userId);
    if (!existing) throw new Error('Projeto não encontrado.');

    const updated: MarketingProject = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return await marketingRepository.saveProject(updated);
  }

  /**
   * Formats marketing project as exportable text bundle
   */
  exportProjectBundle(project: MarketingProject): string {
    return `=== VETMIND MARKETING STUDIO - EXPORT ===
[PROJETO]: ${project.title}
[FORMATO]: ${project.format}
[CLÍNICA]: ${project.brandKit.name}

--- HEADLINE ---
${project.copy.headline}

--- SUBHEADLINE ---
${project.copy.subheadline}

--- LEGENDA / CAPTION ---
${project.copy.caption}

--- CALL TO ACTION ---
${project.copy.cta}

--- HASHTAGS ---
${project.copy.hashtags.join(' ')}

--- TEXTO ALTERNATIVO (ALT) ---
${project.copy.altText}

--- ASSET GRÁFICO URL ---
${project.imageUrl || 'Asset pendente de geração.'}
==========================================`;
  }
}

export const marketingService = new MarketingService();
