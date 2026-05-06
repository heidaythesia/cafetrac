import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function AddItemDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Beverages',
    currentStock: 0,
    parLevel: 10,
    reorderQuantity: 20,
    unit: 'kg',
    costPerUnit: 0,
    locationId: localStorage.getItem('selectedLocationId') || '' // Sync with global selection
  });

  const mutation = useMutation({
    mutationFn: async (newItem: typeof formData) => {
      // Ensure we have a locationId, even if it changed in localStorage since init
      const locId = newItem.locationId || localStorage.getItem('selectedLocationId');
      if (!locId) throw new Error('Please select a specific location/branch first.');
      
      return await client.post('/inventory', { ...newItem, locationId: locId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Item added successfully!');
      setOpen(false);
      setFormData({
        name: '',
        category: 'Beverages',
        currentStock: 0,
        parLevel: 10,
        reorderQuantity: 20,
        unit: 'kg',
        costPerUnit: 0,
        locationId: localStorage.getItem('selectedLocationId') || ''
      });
    },
    onError: (err: any) => {
      toast.error(err.message || err.response?.data?.error?.message || 'Failed to add item.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Name is required');
    if (formData.costPerUnit <= 0) return toast.error('Cost per unit must be greater than 0');
    
    // Final check for locationId before mutating
    const locId = formData.locationId || localStorage.getItem('selectedLocationId');
    if (!locId) return toast.error('Please select a specific branch from the top menu first.');
    
    mutation.mutate({ ...formData, locationId: locId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="w-full md:w-auto h-12 md:h-10 rounded-xl md:rounded-lg shadow-sm active:scale-95 transition-all font-bold md:font-medium" />}>
        + Add Item
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-heading font-bold">New Inventory Item</DialogTitle>
          <DialogDescription>
            Enter stock details. All fields are tracked in real-time.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 p-6 pb-8 space-y-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Item Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. Whole Milk" 
                className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20 focus-visible:ring-primary placeholder:text-foreground/30"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val ?? formData.category })}
                >
                  <SelectTrigger id="category" className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Beverages', 'Cleaning', 'Food', 'Other', 'Packaging'].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPerUnit" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Cost Per Unit ($)</Label>
                <Input 
                  id="costPerUnit" 
                  type="number"
                  step="0.01"
                  className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20"
                  value={formData.costPerUnit === 0 ? '' : formData.costPerUnit}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, costPerUnit: val });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="unit" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Unit</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(val) => setFormData({ ...formData, unit: val ?? formData.unit })}
                >
                  <SelectTrigger id="unit" className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20">
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Grams', 'kg', 'Liters', 'ml', 'Pcs'].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Current Stock</Label>
                <Input 
                  id="stock" 
                  type="number"
                  className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20"
                  value={formData.currentStock === 0 ? '' : formData.currentStock}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, currentStock: val });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="par" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Par Level</Label>
                <Input 
                  id="par" 
                  type="number"
                  className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20"
                  value={formData.parLevel === 0 ? '' : formData.parLevel}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, parLevel: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder" className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Reorder Qty</Label>
                <Input 
                  id="reorder" 
                  type="number"
                  className="h-12 rounded-xl bg-white/40 backdrop-blur-sm border-2 border-primary/20"
                  value={formData.reorderQuantity === 0 ? '' : formData.reorderQuantity}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Number(e.target.value);
                    setFormData({ ...formData, reorderQuantity: val });
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-8 bg-muted/10 border-t border-border sticky bottom-0">
            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing...' : 'Save Inventory Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
