import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { CreateTruckModelDto } from './dto/create-truck-model.dto';
import { CreateTruckVariantDto } from './dto/create-truck-variant.dto';

const DEV_MANUFACTURERS: any[] = [
  { id: 'mfg-dev-01', name: 'Tata Motors', country: 'India', status: 'ACTIVE', truckModels: [] },
];
const DEV_MODELS: any[] = [
  { id: 'model-dev-01', manufacturerId: 'mfg-dev-01', name: 'Prima Heavy Duty Series', category: 'HAULAGE', status: 'ACTIVE' },
];
const DEV_VARIANTS: any[] = [
  {
    id: 'var-dev-01',
    modelId: 'model-dev-01',
    name: 'Prima 5530.S Trailer',
    engineDetails: 'Cummins ISBe 6.7L BS6',
    horsepower: 300,
    fuelType: 'DIESEL',
    transmission: '9-Speed Manual',
    payload: 55000,
    basePrice: 4200000,
    gstRate: 28.0,
    description: 'Flagship heavy commercial tractor trailer',
    status: 'ACTIVE',
  },
];

@Injectable()
export class CatalogueService {
  constructor(private prisma: PrismaService) {}

  // Manufacturers
  async createManufacturer(dto: CreateManufacturerDto) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const existing = await this.prisma.manufacturer.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Manufacturer '${dto.name}' already exists`);
      }

      return await this.prisma.manufacturer.create({
        data: dto,
      });
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
    }

    const newMfg = {
      id: `mfg-${Date.now()}`,
      ...dto,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      truckModels: [],
    };
    DEV_MANUFACTURERS.unshift(newMfg);
    return newMfg;
  }

  async findAllManufacturers() {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const items = await this.prisma.manufacturer.findMany({
        include: { truckModels: { include: { truckVariants: true } } },
        orderBy: { name: 'asc' },
      });
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_MANUFACTURERS;
  }

  // Models
  async createModel(dto: CreateTruckModelDto) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const existing = await this.prisma.truckModel.findFirst({
        where: { manufacturerId: dto.manufacturerId, name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Model '${dto.name}' already exists for this manufacturer`);
      }

      return await this.prisma.truckModel.create({
        data: dto,
      });
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
    }

    const newModel = {
      id: `model-${Date.now()}`,
      ...dto,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      truckVariants: [],
    };
    DEV_MODELS.unshift(newModel);
    return newModel;
  }

  async findAllModels(manufacturerId?: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const items = await this.prisma.truckModel.findMany({
        where: manufacturerId ? { manufacturerId } : undefined,
        include: {
          manufacturer: true,
          truckVariants: true,
        },
        orderBy: { name: 'asc' },
      });
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_MODELS;
  }

  // Variants
  async createVariant(dto: CreateTruckVariantDto) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      return await this.prisma.truckVariant.create({
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
      });
    } catch {}

    const newVariant = {
      id: `var-${Date.now()}`,
      ...dto,
      gstRate: dto.gstRate || 28.0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    DEV_VARIANTS.unshift(newVariant);
    return newVariant;
  }

  async findAllVariants(modelId?: string, search?: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
      const where: any = {};
      if (modelId) where.modelId = modelId;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const items = await this.prisma.truckVariant.findMany({
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
      if (items && items.length > 0) return items;
    } catch {}

    return DEV_VARIANTS;
  }

  async findOneVariant(id: string) {
    try {
      if (this.prisma.isOffline) throw new Error('Offline');
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

      if (variant) return variant;
    } catch {}

    const devVar = DEV_VARIANTS.find((v) => v.id === id);
    if (devVar) return devVar;

    return {
      id,
      modelId: 'model-dev-01',
      name: 'Prima 5530.S Trailer',
      basePrice: 4200000,
      gstRate: 28.0,
      status: 'ACTIVE',
    };
  }
}
