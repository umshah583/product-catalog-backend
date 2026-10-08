import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreditApplicationsRepository } from './credit-applications.repository.js';
import { CreditApplicationPdfService } from './credit-application-pdf.service.js';
import {
  CreateCreditApplicationDto,
  UpdateCreditApplicationDto,
  UpsertDocumentDto,
} from './dto/credit-application.dto.js';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DRAFT'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED', 'SUBMITTED'],
  APPROVED: [],
  REJECTED: ['DRAFT'],
};

@Injectable()
export class CreditApplicationsService {
  constructor(
    private repo: CreditApplicationsRepository,
    private pdf: CreditApplicationPdfService,
  ) {}

  private async generateNumber(tenantId: string): Promise<string> {
    const count = await this.repo.countForTenant(tenantId);
    return `CA-${String(count + 1).padStart(6, '0')}`;
  }

  async create(tenantId: string, dto: CreateCreditApplicationDto) {
    const appNumber = await this.generateNumber(tenantId);
    const app = await this.repo.create(tenantId, appNumber, dto);
    await this.repo.audit(app.id, 'CREATED', 'Application created', null);
    return app;
  }

  async findAll(tenantId: string, status?: string) {
    return this.repo.findAll(tenantId, status);
  }

  async findById(tenantId: string, id: string) {
    const app = await this.repo.findById(tenantId, id);
    if (!app) throw new NotFoundException('Credit application not found');
    return app;
  }

  async update(tenantId: string, id: string, dto: UpdateCreditApplicationDto) {
    const app = await this.findById(tenantId, id);
    if (app.status === 'APPROVED') {
      throw new BadRequestException('Approved applications cannot be edited');
    }
    const updated = await this.repo.update(id, dto);
    await this.repo.audit(id, 'UPDATED', 'Application edited', null);
    return updated;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: string,
    actor: string | null,
    internalNotes?: string,
  ) {
    const app = await this.findById(tenantId, id);
    const allowed = ALLOWED_TRANSITIONS[app.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${app.status} to ${status}`,
      );
    }
    const updated = await this.repo.updateStatus(id, status, actor, internalNotes);
    await this.repo.audit(
      id,
      `STATUS_${status}`,
      internalNotes ? `Status → ${status}: ${internalNotes}` : `Status → ${status}`,
      actor,
    );
    return updated;
  }

  async delete(tenantId: string, id: string) {
    const app = await this.findById(tenantId, id);
    if (app.status !== 'DRAFT') {
      throw new BadRequestException('Only draft applications can be deleted');
    }
    await this.repo.delete(id);
  }

  async addDocument(tenantId: string, id: string, dto: UpsertDocumentDto) {
    await this.findById(tenantId, id);
    const doc = await this.repo.upsertDocument(id, dto);
    await this.repo.audit(id, 'DOCUMENT_UPLOADED', `${dto.docType}: ${dto.fileName}`, null);
    return doc;
  }

  async removeDocument(tenantId: string, id: string, docId: string) {
    await this.findById(tenantId, id);
    await this.repo.deleteDocument(id, docId);
    await this.repo.audit(id, 'DOCUMENT_REMOVED', docId, null);
  }

  async markDocumentReceived(
    tenantId: string,
    id: string,
    docId: string,
    received: boolean,
    remarks?: string,
  ) {
    await this.findById(tenantId, id);
    return this.repo.setDocumentReceived(docId, received, remarks);
  }

  /** Returns the generated PDF bytes; caches nothing (regenerates on demand). */
  async generatePdf(tenantId: string, id: string) {
    const app = await this.findById(tenantId, id);
    const pdfBytes = await this.pdf.generate({
      formData: app.formData,
      customerName: app.customerName,
      customerTrn: app.customerTrn,
      signatureData: app.signatureData,
      stampData: app.stampData,
      initials: app.initials,
      appNumber: app.appNumber,
    });
    await this.repo.audit(id, 'PDF_GENERATED', 'PDF generated', null);
    return { bytes: pdfBytes, filename: `credit-application-${app.appNumber}.pdf` };
  }
}
