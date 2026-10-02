import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateFileAttachmentDto } from './dto/create-file-attachment.dto';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async registerFile(dto: CreateFileAttachmentDto, uploadedByUserId: string) {
    const fileId = `FILE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.fileAttachment.create({
      data: {
        fileId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        storageKey: dto.storageKey,
        filename: dto.filename,
        mimeType: dto.mimeType,
        size: dto.size,
        uploadedByUserId,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.fileAttachment.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDownloadUrl(fileId: string) {
    const file = await this.prisma.fileAttachment.findUnique({
      where: { fileId },
    });

    if (!file) {
      throw new NotFoundException(`File ID '${fileId}' not found`);
    }

    // Returns presigned / secure URL metadata
    return {
      fileId: file.fileId,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      storageKey: file.storageKey,
      downloadUrl: `https://storage.titanauto.local/${file.storageKey}?token=simulated_secure_token`,
    };
  }
}
