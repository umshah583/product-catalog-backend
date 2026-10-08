import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsIn,
  IsBoolean,
} from 'class-validator';

export class CreateCreditApplicationDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerTrn?: string;

  /** All application form field values keyed by PDF field names. */
  @IsObject()
  @IsNotEmpty()
  formData!: Record<string, any>;

  @IsString()
  @IsOptional()
  signatureData?: string; // data URL (png)

  @IsString()
  @IsOptional()
  stampData?: string;

  @IsString()
  @IsOptional()
  initials?: string;
}

export class UpdateCreditApplicationDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerTrn?: string;

  @IsObject()
  @IsOptional()
  formData?: Record<string, any>;

  @IsString()
  @IsOptional()
  signatureData?: string;

  @IsString()
  @IsOptional()
  stampData?: string;

  @IsString()
  @IsOptional()
  initials?: string;
}

export class UpdateCreditAppStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'])
  status!:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED';

  @IsString()
  @IsOptional()
  internalNotes?: string;
}

export class UpsertDocumentDto {
  @IsString()
  @IsNotEmpty()
  docType!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsString()
  @IsOptional()
  fileKey?: string;

  @IsBoolean()
  @IsOptional()
  received?: boolean;

  @IsString()
  @IsOptional()
  remarks?: string;
}
