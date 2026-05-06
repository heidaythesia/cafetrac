import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MapPin, Plus, Building } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  address: z.string().min(1, 'Address is required')
});

type FormValues = z.infer<typeof schema>;

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = React.useState(false);

  const { data: locations, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const createMutation = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Location added successfully');
      setIsAdding(false);
      reset();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to add location');
    }
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };

  if (isLoading) return <div className="p-8 text-primary animate-pulse">Loading locations...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Cafe Branches</h1>
          <p className="text-foreground/60 mt-1">Manage your multiple locations</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold mb-4">Add New Branch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Branch Name</label>
              <input {...register('name')} className="w-full p-2.5 bg-background border border-border rounded-xl" placeholder="e.g. Downtown Cafe" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Address / Region</label>
              <input {...register('address')} className="w-full p-2.5 bg-background border border-border rounded-xl" placeholder="e.g. 123 Main St" />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 font-bold text-foreground/60 hover:bg-foreground/5 rounded-xl">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 font-bold bg-primary text-primary-foreground rounded-xl disabled:opacity-50">
              {createMutation.isPending ? 'Saving...' : 'Save Branch'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations?.map((loc) => (
          <div key={loc._id} className="bg-card p-5 rounded-2xl shadow-sm border border-border flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{loc.name}</h3>
              <div className="flex items-center gap-1.5 text-foreground/60 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {loc.address}
              </div>
            </div>
          </div>
        ))}
        {locations?.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-foreground/50 border-2 border-dashed border-border rounded-2xl">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No locations added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
