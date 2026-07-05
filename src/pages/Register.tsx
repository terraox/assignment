import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ChevronDown } from 'lucide-react';

import { ShineBorder } from '../components/ui/shine-border';

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  role: z.enum(['Admin', 'Employee']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'Employee'
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError('');
      await api.post('/auth/register', data);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="relative surface-1 rounded-xl p-8 max-w-sm w-full overflow-hidden shadow-2xl">
        <ShineBorder shineColor={["#5e6ad2", "#828fff", "#e5a03e"]} borderWidth={2} />
        
        <div className="relative z-10">
          <h1 className="text-[28px] font-semibold text-ink tracking-headline mb-6">Create Account</h1>
          <div className="min-h-[44px] mb-4">
            {error && <div className="bg-danger/20 text-danger px-4 py-2 rounded-md text-sm">{error}</div>}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Full Name</label>
              <input type="text" {...register('name')} className="input" placeholder="John Doe" />
              {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
              <input type="email" {...register('email')} className="input" placeholder="you@company.com" />
              <p className="text-ink-subtle text-[11px] mt-1.5 leading-tight">Must be a unique email address.</p>
              {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Password</label>
              <input type="password" {...register('password')} className="input" placeholder="••••••••" />
              <p className="text-ink-subtle text-[11px] mt-1.5 leading-tight">Must be at least 8 characters, and include 1 uppercase letter, 1 lowercase letter, and 1 number.</p>
              {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Confirm Password</label>
              <input type="password" {...register('confirmPassword')} className="input" placeholder="••••••••" />
              {errors.confirmPassword && <p className="text-danger text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1">Role</label>
              <div className="relative">
                <select {...register('role')} className="input bg-surface-1 appearance-none pr-10">
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4">
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account? <Link to="/login" className="text-primary hover:text-primary-hover transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
