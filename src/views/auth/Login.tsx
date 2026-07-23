import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import wizzTechLogo from '../../assets/logo/WIZZTECH-logo.png';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    // Slight artificial delay to showcase the luxury loading state
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = await login(data.email, data.password);
    
    setIsSubmitting(false);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.error || 'Failed to authenticate');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glassmorphism p-8 sm:p-10 rounded-luxury shadow-luxury"
    >
      {/* Brand Identity Header */}
      <div className="flex flex-col items-center mb-5">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="mb-2 flex justify-center cursor-pointer"
          onClick={() => navigate('/login')}
        >
          <img src={wizzTechLogo} alt="WizzTech Logo" className="h-28 w-auto object-contain" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-black tracking-tight text-center">Owner Console</h2>
        <p className="text-xs text-secondary mt-0.5 tracking-normal text-center">
          Access the central demo registry and security dashboard
        </p>
      </div>

      {serverError && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-5 p-3.5 rounded-xl border border-red-200/50 bg-red-50/50 text-red-600 text-xs font-medium"
        >
          {serverError}
        </motion.div>
      )}

      {/* Form Submission */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
            Email Address
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center transition-colors">
              <Mail className="w-5 h-5 text-black" strokeWidth={2.5} />
            </span>
            <input
              type="email"
              disabled={isSubmitting}
              placeholder="e.g., owner@wizztech.com"
              {...register('email')}
              className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-white/70 backdrop-blur-sm outline-none transition-all duration-200 
                ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400/20' : 'border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20'}
                text-black placeholder:text-secondary/40 font-medium`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80">
              Security Key (Password)
            </label>
            <Link
              to="/forgot-password"
              className="text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Forgot key?
            </Link>
          </div>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center transition-colors">
              <Lock className="w-5 h-5 text-black" strokeWidth={2.5} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              disabled={isSubmitting}
              placeholder="••••••••••••"
              {...register('password')}
              className={`w-full pl-10 pr-10 py-3 text-sm rounded-xl border bg-white/70 backdrop-blur-sm outline-none transition-all duration-200
                ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400/20' : 'border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20'}
                text-black placeholder:text-secondary/40 font-medium`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-black" strokeWidth={2.5} />
              ) : (
                <Eye className="w-5 h-5 text-black" strokeWidth={2.5} />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-500 font-medium mt-0.5">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={isSubmitting}
              {...register('rememberMe')}
              className="w-4.5 h-4.5 rounded-lg border-border/80 text-primary focus:ring-0 cursor-pointer accent-primary"
            />
            <span className="text-[12px] font-semibold text-secondary hover:text-black transition-colors">
              Remember this device
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative py-3.5 px-4 mt-6 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-luxury overflow-hidden disabled:opacity-85 disabled:cursor-not-allowed group cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Verifying Identity...</span>
            </>
          ) : (
            <>
              <span>Authenticate</span>
              <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};
