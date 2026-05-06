import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { client } from '@/lib/api/client';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data: FormData) => {
    setErrorMsg('');
    try {
      await client.post('/auth/reset-password', { token, password: data.password });
      setSuccess(true);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.error?.message || 'Reset failed. Please request a new link.');
    }
  };

  if (!token) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-[1.5rem] border border-border/40 text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid reset link</h1>
          <p className="text-foreground/60 mb-6">This reset link is missing a token.</p>
          <Link to="/forgot" className="text-primary font-bold hover:underline">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/40">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">Reset Password</h1>
          <p className="text-foreground/60 mt-2 text-sm">Set a new password for your account</p>
        </div>

        {success ? (
          <div className="p-6 bg-green-50 text-green-700 border border-green-100 rounded-xl text-center">
            <h3 className="text-lg font-bold mb-2">Password updated</h3>
            <p className="text-sm">You can now log in with your new password.</p>
            <Link to="/login" className="inline-block mt-6 text-primary font-bold hover:underline">Go to log in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="font-semibold text-foreground/80">New Password</Label>
              <Input id="password" type="password" {...register('password')} className="h-12 bg-background/50" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-2 text-left">
              <Label htmlFor="confirmPassword" className="font-semibold text-foreground/80">Confirm Password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} className="h-12 bg-background/50" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-md font-semibold mt-2 rounded-xl">
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
