import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import toast from 'react-hot-toast';
import wizzTechLogo from '../../assets/logo/WIZZTECH-logo.png';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setServerError(error.message);
      } else {
        setIsSent(true);
        toast.success('Password reset email sent');
      }
    } catch (e: any) {
      setServerError(e.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glassmorphism p-8 sm:p-10 rounded-luxury shadow-luxury"
    >
      <div className="flex flex-col items-center mb-5">
        <Link to="/login" className="mb-2 flex justify-center cursor-pointer">
          <img src={wizzTechLogo} alt="WizzTech Logo" className="h-28 w-auto object-contain" />
        </Link>
        
        <h2 className="text-lg font-bold text-black tracking-tight text-center">Reset Security Key</h2>
        <p className="text-xs text-secondary mt-0.5 tracking-normal text-center">
          Recover access to your demo protection platform
        </p>
      </div>

      {isSent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4 space-y-4"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-black">Reset Link Dispatched</h3>
            <p className="text-xs text-secondary max-w-[280px] mx-auto">
              We have dispatched recovery instructions to your email address. Please inspect your inbox.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-hover transition-colors pt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console Login
          </Link>
        </motion.div>
      ) : (
        <>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 p-3.5 rounded-xl border border-red-200/50 bg-red-50/50 text-red-600 text-xs font-medium"
            >
              {serverError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
                Verify Registered Email
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center transition-colors">
                  <Mail className="w-5 h-5 text-black" strokeWidth={2.5} />
                </span>
                <input
                  type="email"
                  disabled={isSubmitting}
                  placeholder="owner@wizztech.com"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative py-3.5 px-4 mt-4 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-luxury disabled:opacity-85 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Console Login
              </Link>
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
};
