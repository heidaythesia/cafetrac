import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/lib/api/teams';
import { locationsApi } from '@/lib/api/locations';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Users, Plus, Shield, UserX, Copy } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['manager', 'staff']),
  locationId: z.string().min(1, 'Must assign to a location')
});

type FormValues = z.infer<typeof schema>;

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const [isInviting, setIsInviting] = React.useState(false);
  const [tempPasswordModal, setTempPasswordModal] = React.useState<{ email: string, pass: string } | null>(null);

  const { data: team, isLoading } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll });
  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: locationsApi.getAll });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const inviteMutation = useMutation({
    mutationFn: teamsApi.invite,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team member invited successfully');
      setTempPasswordModal({ email: data.message, pass: data.tempPassword }); // using message roughly, backend sends tempPassword
      setIsInviting(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to invite');
    }
  });

  const removeMutation = useMutation({
    mutationFn: teamsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member removed');
    }
  });

  const onSubmit = (data: FormValues) => { inviteMutation.mutate(data); };

  if (isLoading) return <div className="p-8 text-primary animate-pulse">Loading team...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Team Management</h1>
          <p className="text-foreground/60 mt-1">Manage managers and staff access</p>
        </div>
        <button 
          onClick={() => setIsInviting(!isInviting)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Invite Member
        </button>
      </div>

      {tempPasswordModal && (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8">
          <h3 className="font-bold text-amber-800 mb-2">Member Created Successfully!</h3>
          <p className="text-amber-700 text-sm mb-4">Please share these temporary credentials with your new team member securely. They will need this to log in.</p>
          <div className="bg-white p-4 rounded-xl border border-amber-200 flex justify-between items-center">
            <div>
              <p className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Temporary Password</p>
              <p className="text-xl font-mono font-bold tracking-widest mt-1">{tempPasswordModal.pass}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(tempPasswordModal.pass);
                toast.success('Copied to clipboard');
              }}
              className="p-2 hover:bg-amber-100 rounded-lg text-amber-700"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setTempPasswordModal(null)} className="mt-4 w-full py-2 bg-amber-200 text-amber-800 font-bold rounded-xl hover:bg-amber-300">I have copied it</button>
        </div>
      )}

      {isInviting && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4">Invite New Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Full Name</label>
              <input {...register('name')} className="w-full p-2.5 bg-background border border-border rounded-xl" placeholder="John Doe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input {...register('email')} type="email" className="w-full p-2.5 bg-background border border-border rounded-xl" placeholder="john@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Role</label>
              <select {...register('role')} className="w-full p-2.5 bg-background border border-border rounded-xl">
                <option value="staff">Staff (Waste Logs Only)</option>
                <option value="manager">Manager (Full Location Access)</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Assign to Branch</label>
              <select {...register('locationId')} className="w-full p-2.5 bg-background border border-border rounded-xl">
                <option value="">-- Select Branch --</option>
                {locations?.map(loc => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
              {errors.locationId && <p className="text-red-500 text-xs mt-1">{errors.locationId.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsInviting(false)} className="px-4 py-2 font-bold text-foreground/60 hover:bg-foreground/5 rounded-xl">Cancel</button>
            <button type="submit" disabled={inviteMutation.isPending} className="px-4 py-2 font-bold bg-primary text-primary-foreground rounded-xl disabled:opacity-50">
              {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-foreground/5 border-b border-border text-sm text-foreground/60">
                <th className="p-4 font-semibold">Member</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team?.map((member) => (
                <tr key={member._id} className="border-b border-border/50 hover:bg-foreground/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{member.name}</p>
                        <p className="text-xs text-foreground/50">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      member.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Shield className="w-3 h-3" />
                      <span className="capitalize">{member.role}</span>
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {locations?.find(l => l._id === member.locationId)?.name || 'Unknown Branch'}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        if(window.confirm(`Remove ${member.name} from team?`)) removeMutation.mutate(member._id);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {team?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-foreground/50">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No team members added yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
