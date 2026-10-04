import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { CreateTruckModelDto } from './dto/create-truck-model.dto';
import { CreateTruckVariantDto } from './dto/create-truck-variant.dto';

@Injectable()
export class CatalogueService {
  constructor(private prisma: PrismaService) {}

  // Manufacturers
  async createManufacturer(dto: CreateManufacturerDto) {
    const existing = await this.prisma.manufacturer.findUnique({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Manufacturer '${dto.name}' already exists`);
    }

    return this.prisma.manufacturer.create({ data: dto });
  }

  async findAllManufacturers() {
    return this.prisma.manufacturer.findMany({
      include: { truckModels: { include: { truckVariants: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneManufacturer(id: string) {
    const manufacturer = await this.prisma.manufacturer.findUnique({
      where: { id },
      include: {
        truckModels: {
          include: { truckVariants: true },
        },
      },
    });

    if (!manufacturer) throw new NotFoundException(`Manufacturer ID '${id}' not found`);
    return manufacturer;
  }

  async updateManufacturer(id: string, dto: Partial<CreateManufacturerDto>) {
    const existing = await this.prisma.manufacturer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Manufacturer ID '${id}' not found`);

    return this.prisma.manufacturer.update({
      where: { id },
      data: { name: dto.name, country: dto.country, status: dto.status },
    });
  }

  async deactivateManufacturer(id: string) {
    const existing = await this.prisma.manufacturer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Manufacturer ID '${id}' not found`);

    return this.prisma.manufacturer.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // Models
  async createModel(dto: CreateTruckModelDto) {
    const manufacturer = await this.prisma.manufacturer.findUnique({ where: { id: dto.manufacturerId } });
    if (!manufacturer) throw new NotFoundException(`Manufacturer ID '${dto.manufacturerId}' not found`);

    const existing = await this.prisma.truckModel.findFirst({
      where: { manufacturerId: dto.manufacturerId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Model '${dto.name}' already exists for this manufacturer`);
    }

    return this.prisma.truckModel.create({
      data: dto,
      include: { manufacturer: true },
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

  async findOneModel(id: string) {
    const model = await this.prisma.truckModel.findUnique({
      where: { id },
      include: { manufacturer: true, truckVariants: true },
    });
    if (!model) throw new NotFoundException(`Truck Model ID '${id}' not found`);
    return model;
  }

  // Variants
  async createVariant(dto: CreateTruckVariantDto) {
    const model = await this.prisma.truckModel.findUnique({ where: { id: dto.modelId } });
    if (!model) throw new NotFoundException(`Truck Model ID '${dto.modelId}' not found`);

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
        gstRate: dto.gstRate || 28.0,
        description: dto.description,
        images: dto.images || [],
      },
      include: { model: { include: { manufacturer: true } } },
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
        model: { include: { manufacturer: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneVariant(id: string) {
    const variant = await this.prisma.truckVariant.findUnique({
      where: { id },
      include: {
        model: { include: { manufacturer: true } },
      },
    });

    if (!variant) throw new NotFoundException(`Truck Variant ID '${id}' not found`);
    return variant;
  }

  async updateVariant(id: string, dto: Partial<CreateTruckVariantDto>) {
    const existing = await this.prisma.truckVariant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Truck Variant ID '${id}' not found`);

    return this.prisma.truckVariant.update({
      where: { id },
      data: {
        name: dto.name,
        engineDetails: dto.engineDetails,
        horsepower: dto.horsepower,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        payload: dto.payload,
        basePrice: dto.basePrice,
        gstRate: dto.gstRate,
        description: dto.description,
        images: dto.images,
      },
      include: { model: { include: { manufacturer: true } } },
    });
  }

  async deactivateVariant(id: string) {
    const existing = await this.prisma.truckVariant.findUnique({
      where: { id },
      include: { _count: { select: { vehicles: true, quotations: true } } },
    });
    if (!existing) throw new NotFoundException(`Truck Variant ID '${id}' not found`);

    if (existing._count.vehicles > 0 || existing._count.quotations > 0) {
      return this.prisma.truckVariant.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    }

    return this.prisma.truckVariant.delete({ where: { id } });
  }
}
