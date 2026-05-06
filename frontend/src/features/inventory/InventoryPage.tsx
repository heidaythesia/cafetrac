import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddItemDialog } from './AddItemDialog';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  currentStock: number;
  parLevel: number;
  reorderQuantity: number;
  unit: string;
  supplierId?: string;
}

export default function InventoryPage() {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await client.get('/inventory');
      return res.data.data as InventoryItem[];
    }
  });

  const draftPOMutation = useMutation({
    mutationFn: async (item: InventoryItem) => {
      if (!item.supplierId) throw new Error("No supplier linked to this item.");
      return await client.post('/purchase-orders', {
        supplierId: item.supplierId,
        items: [{
          inventoryItemId: item._id,
          quantityOrdered: item.reorderQuantity > 0 ? item.reorderQuantity : item.parLevel * 2 || 10
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Draft PO created!');
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.error?.message || 'Failed to create PO.');
    }
  });

  const getStatusBadge = (item: InventoryItem) => {
    if (item.currentStock === 0) return <Badge className="bg-rosehip hover:bg-rosehip/90 text-white rounded-lg shadow-sm">Critical</Badge>;
    if (item.currentStock <= item.parLevel) return <Badge className="bg-caramel/20 text-caramel border-caramel/20 rounded-lg shadow-sm animate-pulse">Low Stock</Badge>;
    return <Badge className="bg-matcha hover:bg-matcha/90 text-white rounded-lg shadow-sm">OK</Badge>;
  };

  return (
    <div className="pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground tracking-tight">Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">Real-time stock monitoring and replenishment.</p>
        </div>
        <div className="w-full md:w-auto">
          <AddItemDialog />
        </div>
      </div>
      {!isOnline && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Offline mode: showing cached stock levels (read only).
        </div>
      )}

      {/* Mobile Card View (Hidden on Desktop) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-card p-4 rounded-2xl border border-border animate-pulse">
              <div className="flex justify-between mb-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-12" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-6" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))
        ) : isError ? (
          <div className="text-center py-12 text-destructive bg-destructive/5 rounded-2xl border border-destructive/20">
            Failed to load inventory.
          </div>
        ) : data?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
            No items in stock. Click + Add Item to begin.
          </div>
        ) : (
          data?.map((item) => (
            <div key={item._id} className="bg-card p-5 rounded-2xl border border-border shadow-soft active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-3">
                {getStatusBadge(item)}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{item.category}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{item.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-2xl font-bold font-mono">{item.currentStock}</span>
                <span className="text-sm text-muted-foreground font-medium">{item.unit}</span>
              </div>

              {item.currentStock <= item.parLevel ? (
                <Button
                  className="w-full h-12 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-100 font-bold"
                  onClick={() => draftPOMutation.mutate(item)}
                  disabled={draftPOMutation.isPending || !isOnline}
                >
                  Reorder Stock
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full h-12 rounded-xl opacity-40">
                  Stock OK
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-card shadow-soft">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stock Level</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              data?.map((item) => (
                <TableRow key={item._id} className="hover:bg-muted/10 border-border transition-colors group">
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground font-medium">{item.category}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-lg transition-colors duration-500">
                    {item.currentStock} <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.currentStock <= item.parLevel ? (
                      <Button
                        size="sm"
                        className="rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100"
                        onClick={() => draftPOMutation.mutate(item)}
                        disabled={draftPOMutation.isPending || !isOnline}
                      >
                        Reorder
                      </Button>
                    ) : (
                      <span className="text-muted-foreground/30 text-sm">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
