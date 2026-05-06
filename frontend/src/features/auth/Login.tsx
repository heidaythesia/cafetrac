import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '@/lib/api/client';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await client.post('/auth/login', data);
      login(res.data.data.accessToken, res.data.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to login');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/40 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-foreground/60 mt-2 text-sm">Log in to manage your cafe's inventory</p>
        </div>

        {error && <div className="p-3 mb-6 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="font-semibold text-foreground/80">Email</Label>
            <Input id="email" type="email" placeholder="hello@cafetrac.com" {...register('email')} className="h-12 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="font-semibold text-foreground/80">Password</Label>
              <Link to="/forgot" className="text-sm text-primary font-medium hover:underline transition-all">Forgot password?</Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} className="h-12 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-md font-semibold mt-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </Button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-card text-foreground/50 font-medium">Or continue with</span></div>
          </div>

          <Button variant="outline" type="button" className="w-full h-12 bg-white text-foreground border-border hover:bg-gray-50 rounded-xl font-medium transition-all active:scale-[0.98]">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Google
          </Button>
        </form>

        <p className="text-center text-sm text-foreground/70 mt-8">
          Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline transition-all">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
