import { Module, Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { AddressesService } from "./addresses.service";
import { CreateAddressDto, UpdateAddressDto } from "./dto/addresses.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentAccount } from "../auth/current-account.decorator";
import type { JwtPayload } from "../auth/auth.service";

@Controller("addresses")
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentAccount() account: JwtPayload) {
    return this.addresses.listByAccount(account.sub);
  }

  @Post()
  create(@CurrentAccount() account: JwtPayload, @Body() dto: CreateAddressDto) {
    return this.addresses.create(account.sub, dto);
  }

  @Put(":id")
  update(
    @CurrentAccount() account: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto
  ) {
    return this.addresses.update(account.sub, id, dto);
  }

  @Delete(":id")
  remove(@CurrentAccount() account: JwtPayload, @Param("id") id: string) {
    return this.addresses.remove(account.sub, id);
  }
}

@Module({
  controllers: [AddressesController],
  providers: [AddressesService, PrismaService],
  exports: [AddressesService],
})
export class AddressesModule {}
