import { apiFetch, unwrapData } from './apiClient';
import { TruckVariant, TruckModel, Manufacturer } from '@/types/domain';

export interface CatalogVariantItem {
  id: string;
  modelId: string;
  name: string;
  manufacturerName?: string;
  modelName?: string;
  engineDetails?: string;
  horsepower?: number;
  fuelType?: string;
  transmission?: string;
  payload?: number;
  basePrice: number;
  gstRate?: number;
  description?: string;
  specifications?: Record<string, any>;
  images?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  availableBranches?: { branchId: string; branchName: string; count: number }[];
}

// Fallback commercial truck catalogue data for Ashok Leyland / Tata Motors when database is empty
export const FALLBACK_CATALOG: CatalogVariantItem[] = [
  {
    id: 'var-al-4825',
    modelId: 'mdl-al-4825',
    name: 'Ashok Leyland 4825 10x4 Tipper',
    manufacturerName: 'Ashok Leyland',
    modelName: '4825 Haulage',
    engineDetails: 'A Series 6-Cylinder i-Gen6 BS6 250HP',
    horsepower: 250,
    fuelType: 'diesel',
    transmission: 'manual',
    payload: 34000,
    basePrice: 4850000,
    gstRate: 28,
    description: 'Heavy duty 10-wheeler commercial tipper truck for mining, construction, and long-haul heavy goods transport.',
    specifications: {
      gvw: '47,500 kg',
      clutch: '395 mm dia single plate dry type',
      brakes: 'Full air dual line brakes with ABS',
      fuelTankCapacity: '375 Litres',
      maxTorque: '900 Nm @ 1100-1900 rpm',
    },
    images: [
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableBranches: [
      { branchId: 'br-jaipur', branchName: 'Jaipur Branch', count: 3 },
      { branchId: 'br-jodhpur', branchName: 'Jodhpur Branch', count: 1 },
    ],
  },
  {
    id: 'var-al-3520',
    modelId: 'mdl-al-3520',
    name: 'Ashok Leyland 3520 8x2 Multi-Axle Truck',
    manufacturerName: 'Ashok Leyland',
    modelName: '3520 Haulage',
    engineDetails: 'H Series 6-Cylinder i-Gen6 BS6 200HP',
    horsepower: 200,
    fuelType: 'diesel',
    transmission: 'manual',
    payload: 25000,
    basePrice: 3820000,
    gstRate: 28,
    description: 'Versatile 12-wheeler long haulage truck engineered for high payload capacity and maximum fuel efficiency.',
    specifications: {
      gvw: '35,000 kg',
      clutch: '380 mm dia single plate',
      brakes: 'Full air dual line with ABS',
      fuelTankCapacity: '375 Litres',
      maxTorque: '700 Nm @ 1200-2000 rpm',
    },
    images: [
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableBranches: [
      { branchId: 'br-jaipur', branchName: 'Jaipur Branch', count: 2 },
    ],
  },
  {
    id: 'var-al-5525',
    modelId: 'mdl-al-5525',
    name: 'Ashok Leyland 5525 4x2 Tractor Trailer',
    manufacturerName: 'Ashok Leyland',
    modelName: '5525 Tractor',
    engineDetails: 'A Series 6-Cylinder i-Gen6 BS6 250HP',
    horsepower: 250,
    fuelType: 'diesel',
    transmission: 'manual',
    payload: 41500,
    basePrice: 4290000,
    gstRate: 28,
    description: 'High performance tractor head for container transport, steel coil movement, and heavy inter-state logistics.',
    specifications: {
      gvw: '55,000 kg GCW',
      clutch: '395 mm dia heavy duty',
      brakes: 'Full air dual line brakes',
      fuelTankCapacity: '400 Litres',
      maxTorque: '900 Nm @ 1100-1900 rpm',
    },
    images: [
      'https://images.unsplash.com/photo-1586191582056-a1851e33e750?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableBranches: [
      { branchId: 'br-jodhpur', branchName: 'Jodhpur Branch', count: 2 },
    ],
  },
  {
    id: 'var-tm-prima-5530',
    modelId: 'mdl-tm-prima',
    name: 'Tata Prima 5530.S Trailer',
    manufacturerName: 'Tata Motors',
    modelName: 'Prima Series',
    engineDetails: 'Cummins ISBe 6.7L BS6 300HP',
    horsepower: 300,
    fuelType: 'diesel',
    transmission: 'manual',
    payload: 42000,
    basePrice: 5100000,
    gstRate: 28,
    description: 'Premium world-class commercial tractor trailer equipped with ergonomic cabin, telematics, and heavy hauling power.',
    specifications: {
      gvw: '55,000 kg GCW',
      clutch: '430 mm push type single plate',
      brakes: 'Full air S-cam brakes with ABS',
      fuelTankCapacity: '550 Litres',
      maxTorque: '1100 Nm @ 1100-1700 rpm',
    },
    images: [
      'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableBranches: [
      { branchId: 'br-jaipur', branchName: 'Jaipur Branch', count: 4 },
      { branchId: 'br-jodhpur', branchName: 'Jodhpur Branch', count: 2 },
    ],
  },
];

export const catalogueService = {
  async getManufacturers(): Promise<Manufacturer[]> {
    const res = await apiFetch<any>('/catalogue/manufacturers');
    const unwrapped = unwrapData<any>(res);
    return Array.isArray(unwrapped) ? unwrapped : [];
  },

  async getModels(manufacturerId?: string): Promise<TruckModel[]> {
    const query = manufacturerId ? `?manufacturerId=${encodeURIComponent(manufacturerId)}` : '';
    const res = await apiFetch<any>(`/catalogue/truck-models${query}`);
    const unwrapped = unwrapData<any>(res);
    return Array.isArray(unwrapped) ? unwrapped : [];
  },

  async getVariants(search?: string, modelId?: string): Promise<CatalogVariantItem[]> {
    const cleanParams: Record<string, string> = {};
    if (search) cleanParams.search = search;
    if (modelId) cleanParams.modelId = modelId;
    const query = new URLSearchParams(cleanParams).toString();
    const res = await apiFetch<any>(`/catalogue/truck-variants${query ? `?${query}` : ''}`);
    const unwrapped = unwrapData<any>(res);

    if (Array.isArray(unwrapped)) {
      return unwrapped.map((item: any) => ({
        ...item,
        manufacturerName: item.model?.manufacturer?.name || item.manufacturerName || 'Ashok Leyland',
        modelName: item.model?.name || item.modelName || 'Commercial Truck',
      }));
    }
    return [];
  },

  async getVariantById(id: string): Promise<CatalogVariantItem | null> {
    const res = await apiFetch<any>(`/catalogue/truck-variants/${id}`);
    const item = unwrapData<any>(res);
    if (item && item.id) {
      return {
        ...item,
        manufacturerName: item.model?.manufacturer?.name || 'Ashok Leyland',
        modelName: item.model?.name || 'Commercial Truck',
      };
    }
    return null;
  },
};
