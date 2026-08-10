import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { UploadComplianceDocDto } from "./dto/compliance.dto";

// Compliance documents — mill certs, NRCS LoAs, SABS certificates (spec Section 4.5).
// The fileUrl comes from the storage layer decided in ADR-013 (still open at time of
// writing — the admin upload UI in Phase 4 is what triggers that decision). This service
// handles the database record; the actual file storage is a separate concern that the
// admin upload endpoint (task 4.8) will wire in.
@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProduct(productSku: string) {
    const product = await this.prisma.product.findUnique({ where: { sku: productSku } });
    if (!product) throw new NotFoundException(`Product ${productSku} not found`);
    return this.prisma.complianceDocument.findMany({
      where: { productId: product.id },
      orderBy: { uploadedAt: "desc" },
    });
  }

  async upload(productId: string, dto: UploadComplianceDocDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    return this.prisma.complianceDocument.create({
      data: {
        productId,
        type: dto.type,
        batchRef: dto.batchRef,
        fileUrl: dto.fileUrl,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
      },
    });
  }

  async remove(docId: string) {
    const doc = await this.prisma.complianceDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException(`Compliance document ${docId} not found`);
    await this.prisma.complianceDocument.delete({ where: { id: docId } });
    return { removed: true };
  }
}
