import { Module, Controller, Get, Post, Delete, Param, Body } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { ComplianceService } from "./compliance.service";
import { UploadComplianceDocDto } from "./dto/compliance.dto";

// Public endpoint (list compliance docs for a product — no auth needed, these are
// product/batch data, not personal data per POPIA — guidelines/08). Admin upload/remove
// endpoints are left unguarded for now with the same honest pattern as trade-accounts
// admin endpoints; move behind /v1/admin/ once the admin guard exists (task 4.1).
@Controller("compliance")
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get("products/:sku")
  listByProduct(@Param("sku") sku: string) {
    return this.compliance.listByProduct(sku);
  }

  // Admin — upload a compliance document against a product by ID.
  @Post("products/:productId")
  upload(@Param("productId") productId: string, @Body() dto: UploadComplianceDocDto) {
    return this.compliance.upload(productId, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.compliance.remove(id);
  }
}

@Module({
  controllers: [ComplianceController],
  providers: [ComplianceService, PrismaService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
