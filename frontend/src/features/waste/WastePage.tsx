import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { saveOfflineLog } from '@/lib/offline/db';
import { useOfflineSync } from '@/lib/offline/useOfflineSync';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WastePage() {
  const { isOnline, refreshPendingCount } = useOfflineSync();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('spoilage');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => (await client.get('/inventory')).data.data
  });
  const { data: wasteLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['waste-logs'],
    queryFn: async () => (await client.get('/waste-logs')).data.data
  });

  const mutation = useMutation({
    mutationFn: async (logData: any) => await client.post('/waste-logs', logData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['waste-logs'] });
      localStorage.setItem('firstWasteLogged', 'true');
      setIsSubmitSuccess(true);
      window.setTimeout(() => setIsSubmitSuccess(false), 1500);
      toast.success('Waste logged successfully');
      window.setTimeout(() => setIsOpen(false), 300);
      resetForm();
      refreshPendingCount();
    },
    onError: () => {
      toast.error('Failed to log waste');
    }
  });

  const resetForm = () => {
    setSelectedItem('');
    setQuantity('');
    setReason('spoilage');
  };

  const handleLogWaste = async () => {
    if (!selectedItem || !quantity || isNaN(Number(quantity))) {
      return toast.error('Please select an item and enter a valid quantity');
    }

    const payload = {
      inventoryItemId: selectedItem,
      quantity: Number(quantity),
      reason
    };

    if (!isOnline) {
      await saveOfflineLog(payload);
      localStorage.setItem('firstWasteLogged', 'true');
      setIsSubmitSuccess(true);
      window.setTimeout(() => setIsSubmitSuccess(false), 1500);
      toast.success('Saved offline. Will sync when connected.');
      window.setTimeout(() => setIsOpen(false), 300);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['waste-logs'] });
      refreshPendingCount();
    } else {
      mutation.mutate(payload);
    }
  };

  return (
    <div className="bg-card p-4 md:p-8 rounded-[1.5rem] border border-border shadow-sm min-h-[80vh]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Waste Logs</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}></span>
            <p className="text-foreground/70 text-sm font-semibold">{isOnline ? 'Online - Live Sync' : 'Offline Mode'}</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger 
            render={
              <Button size="lg" className="rounded-xl shadow-lg active:scale-95 text-md px-6 bg-merlot hover:bg-merlot/90 text-white border-none">
                Log Waste
              </Button>
            }
          />
          <DialogContent className="bg-card border-border max-w-sm">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-heading">Record Waste</DialogTitle>
            </DialogHeader>
            <div className="px-6 py-4 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/70">Select Item</label>
                <Select value={selectedItem} onValueChange={(val) => setSelectedItem(val || '')}>
                  <SelectTrigger className="h-14 text-lg bg-white border-2 border-primary/10 w-full px-4 rounded-xl">
                    <SelectValue placeholder="Tap to choose item">
                      {selectedItem && inventory?.find((i: any) => i._id === selectedItem)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh]">
                    {isLoading ? <div className="p-2"><Skeleton className="h-8 w-full" /></div> :
                      inventory?.slice().sort((a: any, b: any) => a.name.localeCompare(b.name)).map((i: any) => (
                        <SelectItem key={i._id} value={i._id} className="py-3 px-4">
                          <span className="font-semibold">{i.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({i.currentStock} {i.unit} left)</span>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/70">Quantity</label>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="h-16 text-3xl text-center font-mono font-bold bg-white border-2 border-primary/10 rounded-xl"
                  placeholder="0"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground/70">Reason</label>
                <Select value={reason} onValueChange={(val) => setReason(val || 'spoilage')}>
                  <SelectTrigger className="h-12 bg-white border-2 border-primary/10 w-full px-4 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spoilage">Spoilage</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="overproduction">Overproduction</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="customer_return">Customer Return</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-3 p-6 pt-2">
              <Button
                onClick={handleLogWaste}
                disabled={mutation.isPending}
                className={`h-14 w-full text-lg font-bold rounded-xl shadow-md text-white border-none transition-all duration-500 active:scale-95 ${isSubmitSuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-merlot hover:bg-merlot/90'}`}
              >
                {mutation.isPending ? 'Saving...' : isSubmitSuccess ? '✓ Saved' : 'Confirm Waste Log'}
              </Button>
              <DialogClose render={
                <Button variant="outline" className="h-12 w-full rounded-xl font-semibold border-2 border-primary/5 hover:bg-primary/5">
                  Cancel
                </Button>
              } />
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Placeholder for logs list */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground/80 mb-4">Recent Activity</h3>
        {isLogsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : wasteLogs?.length ? (
          wasteLogs.slice(0, 6).map((log: any) => (
            <div key={log._id} className="rounded-xl border border-border bg-background p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{log.itemName || 'Waste Entry'}</p>
                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
              <p className="font-mono font-bold text-sm">{log.quantity}</p>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-xl text-foreground/40 font-medium">
            Waste logs will appear here
          </div>
        )}
      </div>
    </div>
  );
}
