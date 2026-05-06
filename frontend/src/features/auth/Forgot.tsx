import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { client } from '@/lib/api/client';

const schema = z.object({
  email: z.string().email('Please enter a valid email')
});

type FormData = z.infer<typeof schema>;

export default function Forgot() {
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    await client.post('/auth/forgot-password', data);
    setSuccess(true);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/40 animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Forgot Password</h1>
          <p className="text-foreground/60 mt-2 text-sm">Enter your email and we'll send you a link</p>
        </div>

        {success ? (
          <div className="p-6 bg-green-50 text-green-700 border border-green-100 rounded-xl text-center animate-in zoom-in-95 duration-300">
            <svg className="w-12 h-12 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold mb-2">Check your inbox</h3>
            <p className="text-sm">We've sent password reset instructions to your email.</p>
            <Link to="/login" className="inline-block mt-6 text-primary font-bold hover:underline">Return to log in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="font-semibold text-foreground/80">Email</Label>
              <Input id="email" type="email" placeholder="hello@cafetrac.com" {...register('email')} className="h-12 bg-background/50 transition-all focus:bg-background focus:ring-2 focus:ring-primary/50" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-md font-semibold mt-2 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </Button>

            <p className="text-center text-sm text-foreground/70 mt-8">
              Remember your password? <Link to="/login" className="text-primary font-bold hover:underline transition-all">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
