import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const { data: pos, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => (await client.get('/purchase-orders')).data.data
  });

  const autoDraftMutation = useMutation({
    mutationFn: async () => await client.post('/purchase-orders/from-low-stock'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success(`${res.data.data.length} purchase orders drafted!`);
    }
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <Badge variant="outline" className="bg-gray-100 text-gray-700 transition-colors duration-300 ease-in-out">Draft</Badge>;
      case 'sent': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-300 ease-in-out">Sent</Badge>;
      case 'received': return <Badge className="bg-green-500 hover:bg-green-600 text-white transition-colors duration-300 ease-in-out">Received</Badge>;
      case 'cancelled': return <Badge className="bg-red-500 hover:bg-red-600 text-white transition-colors duration-300 ease-in-out">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="bg-card p-6 md:p-8 rounded-[1.5rem] border border-border shadow-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Purchase Orders</h2>
          <p className="text-foreground/70 text-sm mt-1">Manage vendor orders and restock inventory.</p>
        </div>
        <Button 
          onClick={() => autoDraftMutation.mutate()} 
          disabled={autoDraftMutation.isPending}
          className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md flex items-center gap-2"
        >
          ⚡ Auto-Generate Reorders
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden bg-background">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Est. Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : pos?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-foreground/50 py-8">No purchase orders found.</TableCell></TableRow>
            ) : (
              pos?.map((po: any) => (
                <TableRow key={po._id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono font-bold text-primary">{po.orderNumber}</TableCell>
                  <TableCell className="font-medium">{po.supplierName}</TableCell>
                  <TableCell>${po.totalEstimatedCost.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/purchase-orders/${po._id}`}>
                      <Button variant="outline" size="sm" className="rounded-lg">View Details</Button>
                    </Link>
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
