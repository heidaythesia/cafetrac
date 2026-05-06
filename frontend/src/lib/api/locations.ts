import { client } from './client';

export interface Location {
  _id: string;
  name: string;
  address: string;
  ownerId: string;
  isActive: boolean;
}

export const locationsApi = {
  getAll: async () => {
    const res = await client.get('/locations');
    return res.data.data as Location[];
  },
  create: async (data: { name: string; address: string }) => {
    const res = await client.post('/locations', data);
    return res.data.data as Location;
  },
  update: async (id: string, data: Partial<Location>) => {
    const res = await client.patch(`/locations/${id}`, data);
    return res.data.data as Location;
  }
};
