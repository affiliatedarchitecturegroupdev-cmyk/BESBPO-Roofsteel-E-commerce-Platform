import { IsString, IsInt, IsOptional, IsEnum, Min, ArrayMinSize, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { QuoteStatus } from "@prisma/client";

export class QuoteItemDto {
  @IsString()
  description: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  unitPrice?: string; // Decimal as string — admin-priced quotes only
}

export class CreateQuoteDto {
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus)
  status: QuoteStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class PriceQuoteItemDto {
  @IsString()
  unitPrice: string; // Decimal as string
}
