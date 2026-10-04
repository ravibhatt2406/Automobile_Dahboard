import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogueService } from './catalogue.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { CreateTruckModelDto } from './dto/create-truck-model.dto';
import { CreateTruckVariantDto } from './dto/create-truck-variant.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Truck Catalogue')
@Controller()
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  // Manufacturers (Supports both /catalogue/manufacturers and /manufacturers)
  @Post(['catalogue/manufacturers', 'manufacturers'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add manufacturer to catalogue (Super Admin Only)' })
  async createManufacturer(@Body() dto: CreateManufacturerDto) {
    return this.catalogueService.createManufacturer(dto);
  }

  @Public()
  @Get(['catalogue/manufacturers', 'manufacturers'])
  @ApiOperation({ summary: 'Get list of truck manufacturers' })
  async findAllManufacturers() {
    return this.catalogueService.findAllManufacturers();
  }

  // Models (Supports both /catalogue/truck-models and /truck-models)
  @Post(['catalogue/truck-models', 'truck-models'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add truck model to catalogue (Super Admin Only)' })
  async createModel(@Body() dto: CreateTruckModelDto) {
    return this.catalogueService.createModel(dto);
  }

  @Public()
  @Get(['catalogue/truck-models', 'truck-models'])
  @ApiOperation({ summary: 'Get list of truck models (filtered by manufacturerId)' })
  async findAllModels(@Query('manufacturerId') manufacturerId?: string) {
    return this.catalogueService.findAllModels(manufacturerId);
  }

  // Variants (Supports both /catalogue/truck-variants and /truck-variants)
  @Post(['catalogue/truck-variants', 'truck-variants'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add truck variant specification to catalogue (Super Admin Only)' })
  async createVariant(@Body() dto: CreateTruckVariantDto) {
    return this.catalogueService.createVariant(dto);
  }

  @Public()
  @Get(['catalogue/truck-variants', 'truck-variants'])
  @ApiOperation({ summary: 'Get list of truck variants and specifications' })
  async findAllVariants(
    @Query('modelId') modelId?: string,
    @Query('search') search?: string,
  ) {
    return this.catalogueService.findAllVariants(modelId, search);
  }

  @Public()
  @Get(['catalogue/truck-variants/:id', 'truck-variants/:id'])
  @ApiOperation({ summary: 'Get details and specs for a specific truck variant' })
  async findOneVariant(@Param('id') id: string) {
    return this.catalogueService.findOneVariant(id);
  }
}
