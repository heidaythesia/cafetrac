import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { Bell, Check, TrendingUp, Package, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await client.get('/notifications')).data.data
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => await client.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <Package className="w-5 h-5 text-amber-500" />;
      case 'waste_spike': return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'daily_digest': return <Clock className="w-5 h-5 text-teal-500" />;
      default: return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="bg-card p-6 md:p-8 rounded-[1.5rem] border border-border shadow-sm min-h-[80vh] max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-foreground">Notifications</h2>
          <p className="text-foreground/70 text-sm mt-1">Alerts and insights for your cafe.</p>
        </div>
        <Button variant="outline" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
          <Check className="w-4 h-4 mr-2" /> Mark all as read
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : notifications?.length === 0 ? (
          <div className="text-center py-12 text-foreground/50 flex flex-col items-center">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications?.map((notif: any) => (
            <div key={notif._id} onClick={() => {
              if (!notif.isRead) {
                client.patch(`/notifications/${notif._id}/read`).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  queryClient.invalidateQueries({ queryKey: ['unread-count'] });
                });
              }
              window.location.href = notif.link;
            }} className={`p-4 border rounded-xl flex items-start gap-4 cursor-pointer transition-colors ${notif.isRead ? 'bg-background border-border/50 opacity-70' : 'bg-primary/5 border-primary/20 shadow-sm'}`}>
              <div className={`p-3 rounded-full ${notif.isRead ? 'bg-muted' : 'bg-background shadow-sm'}`}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <h4 className={`text-md ${notif.isRead ? 'font-medium' : 'font-bold'} text-foreground`}>{notif.title}</h4>
                <p className="text-sm text-foreground/70 mt-1">{notif.body}</p>
                <p className="text-xs text-foreground/40 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
