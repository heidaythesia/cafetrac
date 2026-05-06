import { Home, Package, Trash2, BarChart3, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/AuthProvider';

export function MobileNav({ pendingWasteCount = 0 }: { pendingWasteCount?: number }) {
  const { user } = useAuth();
  
  const allItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['owner', 'manager'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['owner', 'manager', 'staff'] },
    { icon: Trash2, label: 'Waste', path: '/waste', roles: ['owner', 'manager', 'staff'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['owner', 'manager'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['owner', 'manager', 'staff'] },
  ];

  const items = allItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-6 pt-2 pb-[env(safe-area-inset-bottom,1.5rem)] md:hidden">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-1 p-2 transition-all active:scale-90",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="size-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.path === '/waste' && pendingWasteCount > 0 && (
              <span className="absolute -top-0.5 right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingWasteCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
