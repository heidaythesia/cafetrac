import { client } from './client';

export interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  locationId?: string;
}

export const teamsApi = {
  getAll: async () => {
    const res = await client.get('/teams');
    return res.data.data as TeamMember[];
  },
  invite: async (data: { name: string; email: string; role: 'manager' | 'staff'; locationId?: string }) => {
    const res = await client.post('/teams/invite', data);
    return res.data.data as { userId: string; tempPassword: string; message: string };
  },
  remove: async (id: string) => {
    const res = await client.delete(`/teams/${id}`);
    return res.data;
  }
};
