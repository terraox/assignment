import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../utils/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError('');
      const response = await api.post('/auth/login', data);
      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.token,
          rememberMe: data.rememberMe,
        })
      );
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="surface-1 rounded-xl p-8 max-w-sm w-full">
        <h1 className="text-[28px] font-semibold text-ink tracking-headline mb-6">Sign In</h1>
        <div className="min-h-[44px] mb-4">
          {error && <div className="bg-danger/20 text-danger px-4 py-2 rounded-md text-sm">{error}</div>}
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Email</label>
            <input type="email" {...register('email')} className="input" placeholder="you@company.com" />
            {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Password</label>
            <input type="password" {...register('password')} className="input" placeholder="••••••••" />
            {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="rememberMe" {...register('rememberMe')} className="mr-2" />
            <label htmlFor="rememberMe" className="text-sm text-ink-muted">Remember me</label>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-4">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Don't have an account? <Link to="/register" className="text-primary hover:text-primary-hover transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
}
