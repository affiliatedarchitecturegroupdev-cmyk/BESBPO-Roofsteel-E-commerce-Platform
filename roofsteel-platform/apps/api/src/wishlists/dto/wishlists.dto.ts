import { IsString, IsOptional, IsBoolean } from "class-validator";

export class CreateWishlistDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class AddWishlistItemDto {
  @IsString()
  productId: string;
}
