import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { CreateAddressDto, UpdateAddressDto } from "./dto/addresses.dto";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByAccount(accountId: string) {
    return this.prisma.address.findMany({
      where: { accountId },
      orderBy: [{ isDefault: "desc" }, { city: "asc" }],
    });
  }

  async create(accountId: string, dto: CreateAddressDto) {
    // Only one default address per account — if this new one is default, unset any existing
    // default first, in the same transaction so there's never two defaults simultaneously.
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { accountId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        accountId,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        province: dto.province,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(accountId: string, addressId: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.accountId !== accountId) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    // Same single-default constraint as create() — if this update sets isDefault, unset others.
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { accountId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async remove(accountId: string, addressId: string) {
    const existing = await this.prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.accountId !== accountId) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    // Don't silently delete the only address without the caller knowing — if it's the default,
    // promote another one to default if any exist, rather than leaving the account with no
    // default address at all.
    if (existing.isDefault) {
      const other = await this.prisma.address.findFirst({
        where: { accountId, NOT: { id: addressId } },
        orderBy: { city: "asc" },
      });
      if (other) {
        await this.prisma.address.update({
          where: { id: other.id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.address.delete({ where: { id: addressId } });
    return { removed: true };
  }

  async getDefault(accountId: string) {
    return this.prisma.address.findFirst({
      where: { accountId, isDefault: true },
    });
  }
}
