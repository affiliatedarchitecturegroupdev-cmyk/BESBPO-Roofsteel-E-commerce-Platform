import { IsString, IsEnum, IsEmail, IsOptional } from "class-validator";
import { Province } from "@prisma/client";

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsString()
  cartId: string;

  @IsString()
  deliveryAddressLine1: string;

  @IsString()
  deliveryCity: string;

  @IsEnum(Province)
  province: Province;

  @IsString()
  postalCode: string;

  @IsEnum(["PAYFAST", "LULAPAY", "PAYJUSTNOW"])
  gateway: "PAYFAST" | "LULAPAY" | "PAYJUSTNOW";
}
