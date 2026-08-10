import { IsString, IsEnum, IsOptional, IsDateString } from "class-validator";
import { ComplianceDocType } from "@prisma/client";

export class UploadComplianceDocDto {
  @IsEnum(ComplianceDocType)
  type: ComplianceDocType;

  @IsOptional()
  @IsString()
  batchRef?: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}
