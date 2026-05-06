import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import Forgot from './features/auth/Forgot';
import ResetPassword from './features/auth/ResetPassword';
import InventoryPage from './features/inventory/InventoryPage';
import WastePage from './features/waste/WastePage';
import SuppliersPage from './features/suppliers/SuppliersPage';
import PurchaseOrdersPage from './features/purchase-orders/PurchaseOrdersPage';
import PurchaseOrderDetail from './features/purchase-orders/PurchaseOrderDetail';
import ReportsPage from './features/reports/ReportsPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import TeamsPage from './features/teams/TeamsPage';
import LocationsPage from './features/locations/LocationsPage';
import SettingsPage from './features/settings/SettingsPage';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useOfflineSync } from '@/lib/offline/useOfflineSync';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { locationsApi } from '@/lib/api/locations';
import { Bell, MapPin, ChevronDown } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';

import { MobileNav } from './components/layout/MobileNav';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center bg-background text-primary animate-pulse font-heading font-bold text-xl">CafeTrac.</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { subscribe, permission } = usePushNotifications();
  const queryClient = useQueryClient();
  const { isOnline, wasOffline } = useNetworkStatus();
  const { pendingCount, refreshPendingCount } = useOfflineSync(wasOffline);
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [selectedLocId, setSelectedLocId] = React.useState(localStorage.getItem('selectedLocationId') || '');
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const routeNeedsConnection = !isOnline && ['/reports', '/suppliers', '/purchase-orders'].includes(location.pathname);

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll,
    enabled: user?.role === 'owner'
  });

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLocId(val);
    if (val) localStorage.setItem('selectedLocationId', val);
    else localStorage.removeItem('selectedLocationId');
    window.location.reload();
  };

  React.useEffect(() => {
    if (wasOffline) {
      queryClient.invalidateQueries();
    }
  }, [queryClient, wasOffline]);

  React.useEffect(() => {
    const firstWasteLogged = localStorage.getItem('firstWasteLogged') === 'true';
    const dismissedAt = Number(localStorage.getItem('pwaInstallDismissedAt') || '0');
    const dismissedRecently = dismissedAt && Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000;
    const canShow = firstWasteLogged && !isInstalled && !dismissedRecently && (canInstall || isIOS);
    setShowInstallBanner(canShow);
  }, [canInstall, isIOS, isInstalled, location.pathname]);

  React.useEffect(() => {
    refreshPendingCount();
  }, [location.pathname, refreshPendingCount]);

  React.useEffect(() => {
    const loginCount = parseInt(localStorage.getItem('loginCount') || '0');
    if (loginCount >= 2 && permission === 'default' && !localStorage.getItem('pushPromptDismissed')) {
      const showPrompt = window.confirm("🔔 Enable notifications to get low stock and waste alerts on your phone?");
      if (showPrompt) {
        subscribe();
      } else {
        localStorage.setItem('pushPromptDismissed', 'true');
      }
    }
    if (!sessionStorage.getItem('loginCountSet_session')) {
      localStorage.setItem('loginCount', (loginCount + 1).toString());
      sessionStorage.setItem('loginCountSet_session', 'true');
    }
  }, [permission, subscribe]);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await client.get('/notifications/unread-count')).data.data,
    refetchInterval: 60000
  });

  const isActive = (path: string) => location.pathname === path;
  const navItemClass = (path: string) => 
    `block p-3 rounded-xl font-medium cursor-pointer transition-all ${isActive(path) ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'}`;

  return (
    <div className="flex min-h-[100dvh] bg-background selection:bg-primary/20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border p-6 h-screen sticky top-0 overflow-y-auto">
        <div className="text-3xl font-heading font-bold text-primary mb-10 tracking-tight">CafeTrac.</div>
        <nav className="flex-1 space-y-1.5">
          {(user?.role === 'owner' || user?.role === 'manager') && (
            <Link to="/reports" className={navItemClass('/reports')}>Dashboard</Link>
          )}
          {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'staff') && (
            <Link to="/inventory" className={navItemClass('/inventory')}>
              {user?.role === 'staff' ? 'Record' : 'Inventory'}
            </Link>
          )}
          <Link to="/waste" className={`${navItemClass('/waste')} flex items-center justify-between`}>
            <span>Waste Logs</span>
            {pendingCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </Link>
          {(user?.role === 'owner' || user?.role === 'manager') && (
            <>
              <Link to="/suppliers" className={navItemClass('/suppliers')}>Suppliers</Link>
              <Link to="/purchase-orders" className={navItemClass('/purchase-orders')}>Purchase Orders</Link>
            </>
          )}
          {user?.role === 'owner' && (
            <div className="pt-6 mt-6 border-t border-border/50">
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Administration</p>
              <Link to="/teams" className={navItemClass('/teams')}>Team Members</Link>
              <Link to="/locations" className={navItemClass('/locations')}>Locations</Link>
            </div>
          )}
        </nav>
        <div className="pt-6 border-t border-border mt-auto">
          <div className="flex items-center space-x-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-soft">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full py-3 text-sm text-red-500 font-bold hover:bg-red-50 rounded-xl transition-all active:scale-95">Log out</button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {!isOnline && (
          <div className="sticky top-0 w-full bg-[#F59E0B] text-white text-sm font-bold text-center py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
            📡 You are offline - waste logging still works
          </div>
        )}
        {wasOffline && isOnline && (
          <div className="sticky top-0 w-full bg-[#7BAE7F] text-white text-sm font-bold text-center py-2 z-[60] animate-in slide-in-from-top-2 duration-200">
            ✅ Back online! Syncing your data...
          </div>
        )}
        
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center p-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="text-2xl font-heading font-bold text-primary tracking-tight">CafeTrac.</div>
          <Link to="/notifications" className="relative w-10 h-10 flex items-center justify-center bg-card rounded-xl border border-border">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadData?.count > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background animate-in zoom-in-50 duration-300"></span>}
          </Link>
        </header>

        <div className="flex-1 p-6 pb-20 md:p-12 md:pb-12 max-w-[1200px] mx-auto w-full">
          {/* Top Filter Bar */}
          <div className="flex justify-end mb-8">
            {user?.role === 'owner' && locationsData && locationsData.length > 0 && (
              <div className="flex items-center gap-2 bg-card border border-border pl-3 pr-2 py-2 rounded-xl text-sm font-bold shadow-soft transition-all hover:border-primary/30">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <select value={selectedLocId} onChange={handleLocationChange} className="bg-transparent border-none outline-none pr-6 cursor-pointer text-foreground/80 appearance-none">
                  <option value="">All Locations</option>
                  {locationsData.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 -ml-5 pointer-events-none" />
              </div>
            )}
          </div>

          {routeNeedsConnection ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900 font-semibold">
              Requires connection. Please reconnect to access this page.
            </div>
          ) : (
            <div className="animate-in fade-in duration-200">{children}</div>
          )}
        </div>

        {showInstallBanner && (
          <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-[70] rounded-2xl p-4 text-white shadow-xl bg-gradient-to-r from-[#454851] to-[#73956F]">
            <p className="font-bold text-sm mb-1">📱 Install CafeTrac on your device</p>
            <p className="text-xs opacity-95 mb-3">
              {isIOS
                ? 'To install: tap Share button -> Add to Home Screen'
                : 'Access offline, get notifications, works like a native app'}
            </p>
            <div className="flex gap-2">
              {isIOS ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-11"
                  onClick={() => {
                    localStorage.setItem('pwaInstallDismissedAt', Date.now().toString());
                    setShowInstallBanner(false);
                  }}
                >
                  Got it
                </Button>
              ) : (
                <>
                  <Button size="sm" className="h-11 bg-white text-[#454851] hover:bg-white/90" onClick={install}>
                    Install Now
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-11"
                    onClick={() => {
                      localStorage.setItem('pwaInstallDismissedAt', Date.now().toString());
                      setShowInstallBanner(false);
                    }}
                  >
                    Maybe Later
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        <MobileNav pendingWasteCount={pendingCount} />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reports" element={<ProtectedRoute><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><DashboardLayout><NotificationsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><DashboardLayout><InventoryPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/waste" element={<ProtectedRoute><DashboardLayout><WastePage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><DashboardLayout><SuppliersPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/purchase-orders" element={<ProtectedRoute><DashboardLayout><PurchaseOrdersPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/purchase-orders/:id" element={<ProtectedRoute><DashboardLayout><PurchaseOrderDetail /></DashboardLayout></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><DashboardLayout><TeamsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute><DashboardLayout><LocationsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>} />
        </Routes>
      </Router>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
