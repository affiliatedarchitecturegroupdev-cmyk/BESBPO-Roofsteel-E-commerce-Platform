import { IsString, IsInt, Min, IsOptional, IsNumber, Max, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

// Mirrors MadeToLengthConfig in packages/shared-types — see
// guidelines/04-made-to-length-configurator.md for the full constraint spec.
export class MadeToLengthDto {
  @IsNumber()
  @Min(0.3)
  @Max(0.8)
  gaugeMm: number;

  @IsString()
  profile: string;

  @IsString()
  colour: string;

  @IsInt()
  @Min(1)
  @Max(13200, { message: "Length exceeds the 13.2m maximum for Made to Length sheet — split into multiple lines or contact us for a project quote" })
  lengthMm: number;
}

export class AddCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => MadeToLengthDto)
  mtl?: MadeToLengthDto;

  @IsOptional()
  @IsString()
  cutBendShapeCode?: string;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}
