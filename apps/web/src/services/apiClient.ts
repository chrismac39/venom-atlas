import type {
  AtlasApi,
  ApiEnvelope,
  OrganismDetail,
  ToxinDetail,
  ToxinMechanismDetail,
  ToxinPhysiologyDetail,
  VenomDetail,
} from './contracts';
import type { Citation, GeographicRange, Organism, Venom } from '@venom-atlas/domain';
import { mockApi } from './mockApi';

const dataMode = import.meta.env.VITE_DATA_MODE ?? 'api';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} for ${path}`);
  }
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
};

const api: AtlasApi = {
  listOrganisms: () => getJson<Organism[]>('/api/organisms'),
  getOrganism: (organismId: string) => getJson<OrganismDetail>(`/api/organisms/${organismId}`),
  getOrganismVenoms: (organismId: string) =>
    getJson<Venom[]>(`/api/organisms/${organismId}/venoms`),
  getVenom: (venomId: string) => getJson<VenomDetail>(`/api/venoms/${venomId}`),
  getToxin: (toxinId: string) => getJson<ToxinDetail>(`/api/toxins/${toxinId}`),
  getToxinMechanism: (toxinId: string) =>
    getJson<ToxinMechanismDetail>(`/api/toxins/${toxinId}/mechanism`),
  getToxinPhysiology: (toxinId: string) =>
    getJson<ToxinPhysiologyDetail>(`/api/toxins/${toxinId}/physiology`),
  getOrganismRange: (organismId: string) =>
    getJson<GeographicRange[]>(`/api/organisms/${organismId}/range`),
  getCitation: (citationId: string) => getJson<Citation>(`/api/citations/${citationId}`),
};

export const atlasApi: AtlasApi = dataMode === 'mock' ? mockApi : api;
