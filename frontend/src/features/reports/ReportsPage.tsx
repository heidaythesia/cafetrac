import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Download, Trash2, Calendar, Package, TrendingDown } from 'lucide-react';
import AiInsights from './AiInsights';

export default function ReportsPage() {
  const dateRange = '30d';

  const { data: wasteSummary, isLoading: isLoadingWaste } = useQuery({
    queryKey: ['reports', 'waste-summary', dateRange],
    queryFn: async () => (await client.get(`/reports/waste-summary?range=${dateRange}`)).data.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: inventoryHealth, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['reports', 'inventory-health'],
    queryFn: async () => (await client.get('/reports/inventory-health')).data.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: profitImpact, isLoading: isLoadingProfit } = useQuery({
    queryKey: ['reports', 'profit-impact'],
    queryFn: async () => (await client.get('/reports/profit-impact')).data.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: supplierSummary, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['reports', 'supplier-summary', dateRange],
    queryFn: async () => (await client.get(`/reports/supplier-summary?range=${dateRange}`)).data.data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const COLORS = {
    overproduction: '#2D1E17', // Espresso Bean
    spoilage: '#A67B5B',       // Caramel
    expired: '#BC7C7C',        // Rosehip
    damaged: '#4F6F52',        // Matcha
    customer_return: '#E8DFD8', // Border/Ash
    other: '#9CA3AF'
  };

  const handleExport = () => {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    window.location.href = `${base}/api/v1/reports/export/waste-csv`;
  };

  if (isLoadingWaste || isLoadingInventory || isLoadingProfit || isLoadingSuppliers) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card p-4 md:p-8 rounded-[2rem] border border-border shadow-soft animate-in fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold font-heading text-foreground tracking-tight">Financial Intelligence</h2>
          <p className="text-muted-foreground mt-1 font-medium">Real-time reports based on your operations.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="h-12 px-6 rounded-xl bg-background border-border font-bold shadow-sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <AiInsights />

      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 bg-background rounded-3xl border border-border shadow-soft">
          <div className="flex justify-between items-start mb-2"><span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Total Waste Cost</span><Trash2 className="w-5 h-5 text-caramel" /></div>
          <div className="text-3xl font-bold font-mono text-foreground tracking-tighter">₹{wasteSummary?.totalWasteCost?.toFixed(2)}</div>
          <div className={`text-xs mt-3 font-bold px-2 py-1 rounded-full inline-block ${wasteSummary?.percentageChange > 0 ? 'bg-rosehip/10 text-rosehip' : 'bg-matcha/10 text-matcha'}`}>
            {wasteSummary?.percentageChange > 0 ? '↑' : '↓'} {Math.abs(wasteSummary?.percentageChange || 0).toFixed(1)}% vs previous
          </div>
        </div>
        <div className="p-6 bg-background rounded-3xl border border-border shadow-soft">
          <div className="flex justify-between items-start mb-2"><span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Avg Daily Cost</span><Calendar className="w-5 h-5 text-caramel" /></div>
          <div className="text-3xl font-bold font-mono text-foreground tracking-tighter">₹{wasteSummary?.avgDailyWasteCost?.toFixed(2)}</div>
          <div className="text-[10px] mt-3 font-bold text-muted-foreground uppercase tracking-widest">per day this period</div>
        </div>
        <div className="p-6 bg-background rounded-3xl border border-border shadow-soft">
          <div className="flex justify-between items-start mb-2"><span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Inventory Health</span><Package className="w-5 h-5 text-caramel" /></div>
          <div className={`text-3xl font-bold font-mono tracking-tighter ${inventoryHealth?.healthScore > 80 ? 'text-matcha' : inventoryHealth?.healthScore > 50 ? 'text-caramel' : 'text-rosehip'}`}>
            {inventoryHealth?.healthScore?.toFixed(0)}%
          </div>
          <div className="text-[10px] mt-3 font-bold text-muted-foreground uppercase tracking-widest">{inventoryHealth?.lowStockItems + inventoryHealth?.criticalItems} items need attention</div>
        </div>
        <div className="p-6 bg-background rounded-3xl border border-border shadow-soft">
          <div className="flex justify-between items-start mb-2"><span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Est. Savings</span><TrendingDown className="w-5 h-5 text-matcha" /></div>
          <div className="text-3xl font-bold font-mono text-matcha tracking-tighter">₹{profitImpact?.estimatedMonthlySavings?.toFixed(2) || '0.00'}</div>
          <div className="text-[10px] mt-3 font-bold text-muted-foreground uppercase tracking-widest">vs your baseline period</div>
        </div>
      </div>

      {/* Section 2: Waste Trend Chart */}
      <div className="p-8 bg-background rounded-3xl border border-border shadow-soft">
        <h3 className="text-xl font-bold mb-8 text-foreground tracking-tight">Waste Cost Over Time</h3>
        <div className="h-[320px] w-full">
          {wasteSummary?.dailyTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wasteSummary.dailyTrend}>
                <XAxis dataKey="date" stroke="#A67B5B" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#A67B5B" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="cost" fill="#A67B5B" fillOpacity={0.05} />
                <Line type="monotone" dataKey="cost" stroke="#A67B5B" strokeWidth={4} dot={{ r: 6, fill: '#A67B5B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground/40 font-bold text-lg">No waste logs available to graph</div>
          )}
        </div>
      </div>

      {/* Section 3: Waste Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-background rounded-3xl border border-border shadow-soft">
          <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">Loss by Reason</h3>
          <div className="h-[280px] w-full">
            {wasteSummary?.byReason?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wasteSummary.byReason} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="cost" nameKey="reason">
                    {wasteSummary.byReason.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.reason as keyof typeof COLORS] || COLORS.other} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground/40 font-bold">No data</div>}
          </div>
        </div>
        
        <div className="p-8 bg-background rounded-3xl border border-border shadow-soft">
          <h3 className="text-xl font-bold mb-6 text-foreground tracking-tight">Most Wasted Items</h3>
          <div className="h-[280px] w-full">
            {wasteSummary?.topWastedItems?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteSummary.topWastedItems} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="itemName" type="category" stroke="#2D1E17" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Bar dataKey="totalCost" fill="#A67B5B" radius={[0, 10, 10, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground/40 font-bold">No data</div>}
          </div>
        </div>
      </div>

      {/* Section 4 & 6: Procurement & Additional Intel */}
      <div className="p-6 bg-background rounded-2xl border border-border shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-foreground">Procurement Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="text-sm text-foreground/60 mb-1">Total Suppliers</div>
            <div className="text-2xl font-bold font-mono">{supplierSummary?.totalSuppliers || 0}</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="text-sm text-foreground/60 mb-1">POs Generated</div>
            <div className="text-2xl font-bold font-mono">{supplierSummary?.totalPOsThisPeriod || 0}</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="text-sm text-foreground/60 mb-1">PO Value</div>
            <div className="text-2xl font-bold font-mono text-primary">₹{supplierSummary?.totalPOValue?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="p-4 bg-muted/30 rounded-xl">
            <div className="text-sm text-foreground/60 mb-1">Received POs</div>
            <div className="text-2xl font-bold font-mono text-green-600">{supplierSummary?.posByStatus?.received || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
