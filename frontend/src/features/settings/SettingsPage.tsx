import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { User, Bell, MapPin, Shield, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-card p-6 md:p-8 rounded-[1.5rem] border border-border shadow-soft animate-in fade-in space-y-8">
      <div>
        <h2 className="text-3xl font-bold font-heading text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your account and cafe preferences.</p>
      </div>

      <div className="space-y-4">
        {/* Profile Section */}
        <div className="flex items-center gap-4 p-5 bg-background rounded-2xl border border-border">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-soft">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{user?.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{user?.role} Account</p>
          </div>
        </div>

        {/* Action List */}
        <div className="grid grid-cols-1 gap-3">
          <Button variant="outline" className="justify-start h-16 px-6 rounded-2xl border-border bg-background hover:bg-muted/50">
            <User className="w-5 h-5 mr-4 text-primary" />
            <div className="text-left">
              <div className="font-bold">Account Profile</div>
              <div className="text-xs text-muted-foreground">Update your personal details</div>
            </div>
          </Button>

          <Button variant="outline" className="justify-start h-16 px-6 rounded-2xl border-border bg-background hover:bg-muted/50">
            <Bell className="w-5 h-5 mr-4 text-primary" />
            <div className="text-left">
              <div className="font-bold">Notifications</div>
              <div className="text-xs text-muted-foreground">Manage push and email alerts</div>
            </div>
          </Button>

          {user?.role === 'owner' && (
            <Button variant="outline" className="justify-start h-16 px-6 rounded-2xl border-border bg-background hover:bg-muted/50">
              <MapPin className="w-5 h-5 mr-4 text-primary" />
              <div className="text-left">
                <div className="font-bold">Cafe Locations</div>
                <div className="text-xs text-muted-foreground">Manage branches and staff access</div>
              </div>
            </Button>
          )}

          <Button variant="outline" className="justify-start h-16 px-6 rounded-2xl border-border bg-background hover:bg-muted/50">
            <Shield className="w-5 h-5 mr-4 text-primary" />
            <div className="text-left">
              <div className="font-bold">Security</div>
              <div className="text-xs text-muted-foreground">Change password and MFA settings</div>
            </div>
          </Button>
        </div>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl font-bold mt-8 shadow-lg active:scale-95 transition-all"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-2" /> Log Out
        </Button>
      </div>
    </div>
  );
}
