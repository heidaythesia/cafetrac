import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  cafeName: z.string().min(2, 'Cafe name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await client.post('/auth/register', data);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to register');
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/40 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Create Account</h1>
          <p className="text-foreground/60 mt-2 text-sm">Join CafeTrac and manage your cafe better</p>
        </div>

        {error && <div className="p-3 mb-6 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="name" className="font-semibold text-foreground/80">Full Name</Label>
            <Input id="name" placeholder="John Doe" {...register('name')} className="h-11 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="email" className="font-semibold text-foreground/80">Email</Label>
            <Input id="email" type="email" placeholder="hello@cafetrac.com" {...register('email')} className="h-11 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="cafeName" className="font-semibold text-foreground/80">Cafe Name</Label>
            <Input id="cafeName" placeholder="Central Perk" {...register('cafeName')} className="h-11 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
            {errors.cafeName && <p className="text-red-500 text-xs mt-1">{errors.cafeName.message}</p>}
          </div>

          <div className="space-y-1.5 text-left">
            <Label htmlFor="password" className="font-semibold text-foreground/80">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} className="h-11 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-md font-semibold mt-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <p className="text-center text-sm text-foreground/70 mt-8">
          Already have an account? <Link to="/login" className="text-primary font-bold hover:underline transition-all">Log in</Link>
        </p>
      </div>
    </div>
  );
}
