import { IsString, IsOptional } from "class-validator";

export class ApplyForTradeAccountDto {
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;
}

export class RejectTradeAccountDto {
  @IsString()
  rejectionReason: string;
}
