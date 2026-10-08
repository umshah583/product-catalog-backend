import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  CreateCreditApplicationDto,
  UpdateCreditApplicationDto,
  UpsertDocumentDto,
} from './dto/credit-application.dto.js';

@Injectable()
export class CreditApplicationsRepository {
  constructor(private prisma: PrismaService) {}

  private readonly detailInclude = {
    documents: true,
    audits: { orderBy: { createdAt: 'desc' as const } },
  };

  async create(
    tenantId: string,
    appNumber: string,
    dto: CreateCreditApplicationDto,
  ) {
    return this.prisma.creditApplication.create({
      data: {
        appNumber,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone ?? null,
        customerEmail: dto.customerEmail ?? null,
        customerTrn: dto.customerTrn ?? null,
        formData: dto.formData,
        signatureData: dto.signatureData ?? null,
        stampData: dto.stampData ?? null,
        initials: dto.initials ?? null,
        tenant: { connect: { id: tenantId } },
      },
      include: this.detailInclude,
    });
  }

  async findAll(tenantId: string, status?: string) {
    return this.prisma.creditApplication.findMany({
      where: {
        tenantId,
        ...(status ? { status: status as any } : {}),
      },
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.creditApplication.findFirst({
      where: { id, tenantId },
      include: this.detailInclude,
    });
  }

  async update(id: string, dto: UpdateCreditApplicationDto) {
    return this.prisma.creditApplication.update({
      where: { id },
      data: {
        ...(dto.customerName !== undefined
          ? { customerName: dto.customerName }
          : {}),
        ...(dto.customerPhone !== undefined
          ? { customerPhone: dto.customerPhone }
          : {}),
        ...(dto.customerEmail !== undefined
          ? { customerEmail: dto.customerEmail }
          : {}),
        ...(dto.customerTrn !== undefined
          ? { customerTrn: dto.customerTrn }
          : {}),
        ...(dto.formData !== undefined ? { formData: dto.formData } : {}),
        ...(dto.signatureData !== undefined
          ? { signatureData: dto.signatureData }
          : {}),
        ...(dto.stampData !== undefined ? { stampData: dto.stampData } : {}),
        ...(dto.initials !== undefined ? { initials: dto.initials } : {}),
      },
      include: this.detailInclude,
    });
  }

  async updateStatus(
    id: string,
    status: string,
    actor: string | null,
    internalNotes?: string,
  ) {
    const data: any = { status };
    if (status === 'SUBMITTED') data.submittedAt = new Date();
    if (status === 'UNDER_REVIEW' || status === 'APPROVED' || status === 'REJECTED') {
      data.reviewedAt = new Date();
      data.reviewedBy = actor;
    }
    if (internalNotes !== undefined) data.internalNotes = internalNotes;
    return this.prisma.creditApplication.update({
      where: { id },
      data,
      include: this.detailInclude,
    });
  }

  async delete(id: string) {
    return this.prisma.creditApplication.delete({ where: { id } });
  }

  async countForTenant(tenantId: string): Promise<number> {
    return this.prisma.creditApplication.count({ where: { tenantId } });
  }

  async upsertDocument(applicationId: string, dto: UpsertDocumentDto) {
    // One document record per docType — replace if re-uploaded
    await this.prisma.creditAppDocument.deleteMany({
      where: { applicationId, docType: dto.docType },
    });
    return this.prisma.creditAppDocument.create({
      data: {
        applicationId,
        docType: dto.docType,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileKey: dto.fileKey ?? '',
        received: dto.received ?? true,
        remarks: dto.remarks ?? null,
      },
    });
  }

  async deleteDocument(applicationId: string, docId: string) {
    return this.prisma.creditAppDocument.deleteMany({
      where: { id: docId, applicationId },
    });
  }

  async setDocumentReceived(
    docId: string,
    received: boolean,
    remarks?: string,
  ) {
    return this.prisma.creditAppDocument.update({
      where: { id: docId },
      data: {
        received,
        ...(remarks !== undefined ? { remarks } : {}),
      },
    });
  }

  async audit(
    applicationId: string,
    action: string,
    detail: string | null,
    actor: string | null,
  ) {
    return this.prisma.creditAppAudit.create({
      data: { applicationId, action, detail, actor },
    });
  }

  async setPdfKey(id: string, pdfKey: string) {
    return this.prisma.creditApplication.update({
      where: { id },
      data: { pdfKey },
    });
  }
}
