import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async () => (await client.get(`/purchase-orders/${id}`)).data.data
  });

  const sendMutation = useMutation({
    mutationFn: async () => await client.post(`/purchase-orders/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order sent to supplier!');
    }
  });

  const receiveMutation = useMutation({
    mutationFn: async () => await client.post(`/purchase-orders/${id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock updated for received items!');
    }
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-12 w-1/3 mb-8" /><Skeleton className="h-64 w-full" /></div>;
  if (!po) return <div className="p-8 text-red-500">PO not found</div>;

  return (
    <div className="bg-card p-6 md:p-8 rounded-[1.5rem] border border-border shadow-sm animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold font-heading text-foreground font-mono">{po.orderNumber}</h2>
          <p className="text-foreground/70 mt-1">Supplier: <span className="font-bold text-foreground">{po.supplierName}</span> ({po.supplierEmail || 'No email'})</p>
        </div>
        <div className="flex gap-3">
          {po.status === 'draft' && (
            <>
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending} className="bg-blue-500 hover:bg-blue-600">Send to Supplier ✉</Button>
              <Button variant="outline" className="text-red-500 hover:text-red-600">Cancel</Button>
            </>
          )}
          {po.status === 'sent' && (
            <Button onClick={() => receiveMutation.mutate()} disabled={receiveMutation.isPending} className="bg-green-500 hover:bg-green-600">Mark as Received ✓</Button>
          )}
          {po.status === 'received' && (
            <Badge className="bg-green-500 text-white text-md py-1 px-3">Received on {new Date(po.receivedAt).toLocaleDateString()}</Badge>
          )}
        </div>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead className="text-right">Qty Ordered</TableHead>
              <TableHead className="text-right">Est. Unit Cost</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {po.items.map((item: any) => (
              <TableRow key={item.inventoryItemId}>
                <TableCell className="font-bold text-foreground">{item.itemName}</TableCell>
                <TableCell className="text-right font-mono">{item.quantityOrdered} {item.unit}</TableCell>
                <TableCell className="text-right font-mono">${item.estimatedUnitCost.toFixed(2)}</TableCell>
                <TableCell className="text-right font-mono font-bold">${item.totalCost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="bg-muted/30 p-4 flex justify-between items-center border-t border-border">
          <span className="font-bold text-foreground text-lg">Grand Total</span>
          <span className="font-bold font-mono text-xl text-primary">${po.totalEstimatedCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
