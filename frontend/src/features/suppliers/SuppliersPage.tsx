import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const { data: suppliers, isLoading, isError } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await client.get('/suppliers')).data.data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await client.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted');
    }
  });

  return (
    <div className="bg-card p-6 md:p-8 rounded-[1.5rem] border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Suppliers</h2>
          <p className="text-foreground/70 text-sm mt-1">Manage your vendors and order contacts.</p>
        </div>
        <Button className="rounded-xl shadow-md">+ Add Supplier</Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow><TableCell colSpan={4} className="text-center text-red-500 py-8">Failed to load suppliers.</TableCell></TableRow>
            ) : suppliers?.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-foreground/50 py-8">No suppliers found.</TableCell></TableRow>
            ) : (
              suppliers?.map((s: any) => (
                <TableRow key={s._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold text-foreground">{s.name}</TableCell>
                  <TableCell className="text-foreground/70">{s.contactPerson || '-'}</TableCell>
                  <TableCell className="text-foreground/70">{s.email || '-'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" className="rounded-lg">Edit</Button>
                    <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => deleteMutation.mutate(s._id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
