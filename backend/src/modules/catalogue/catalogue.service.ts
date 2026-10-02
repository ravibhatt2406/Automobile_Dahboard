import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { CreateTruckModelDto } from './dto/create-truck-model.dto';
import { CreateTruckVariantDto } from './dto/create-truck-variant.dto';

@Injectable()
export class CatalogueService {
  constructor(private prisma: PrismaService) {}

  // Manufacturers
  async createManufacturer(dto: CreateManufacturerDto) {
    const existing = await this.prisma.manufacturer.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Manufacturer '${dto.name}' already exists`);
    }

    return this.prisma.manufacturer.create({
      data: dto,
    });
  }

  async findAllManufacturers() {
    return this.prisma.manufacturer.findMany({
      include: { truckModels: { include: { truckVariants: true } } },
      orderBy: { name: 'asc' },
    });
  }

  // Models
  async createModel(dto: CreateTruckModelDto) {
    const existing = await this.prisma.truckModel.findFirst({
      where: { manufacturerId: dto.manufacturerId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Model '${dto.name}' already exists for this manufacturer`);
    }

    return this.prisma.truckModel.create({
      data: dto,
    });
  }

  async findAllModels(manufacturerId?: string) {
    return this.prisma.truckModel.findMany({
      where: manufacturerId ? { manufacturerId } : undefined,
      include: {
        manufacturer: true,
        truckVariants: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Variants
  async createVariant(dto: CreateTruckVariantDto) {
    return this.prisma.truckVariant.create({
      data: {
        modelId: dto.modelId,
        name: dto.name,
        engineDetails: dto.engineDetails,
        horsepower: dto.horsepower,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        payload: dto.payload,
        basePrice: dto.basePrice,
        gstRate: dto.gstRate || 28.00,
        description: dto.description,
        images: dto.images || [],
      },
    });
  }

  async findAllVariants(modelId?: string, search?: string) {
    const where: any = {};
    if (modelId) where.modelId = modelId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.truckVariant.findMany({
      where,
      include: {
        model: {
          include: {
            manufacturer: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneVariant(id: string) {
    const variant = await this.prisma.truckVariant.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            manufacturer: true,
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException(`Truck variant ID '${id}' not found`);
    }

    return variant;
  }
}
