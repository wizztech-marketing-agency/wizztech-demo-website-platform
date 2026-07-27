import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { User as UserIcon, Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ProfileSettings: React.FC = () => {
  const { user, storedPassword, updatePassword, updateProfileName } = useAuth();

  // Name update state
  const [fullName, setFullName] = useState(() => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  });
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.full_name || user?.user_metadata?.name) {
      setFullName(user.user_metadata?.full_name || user.user_metadata?.name);
    }
  }, [user]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: storedPassword || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Sync stored password into current password field when available
  useEffect(() => {
    if (storedPassword) {
      setValue('currentPassword', storedPassword);
    }
  }, [storedPassword, setValue]);

  // Handle Profile Name Update
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    setIsUpdatingName(true);
    const res = await updateProfileName(fullName.trim());
    setIsUpdatingName(false);

    if (res.success) {
      toast.success('Profile name updated successfully');
    } else {
      toast.error(res.error || 'Failed to update name');
    }
  };

  // Handle Password Update
  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsUpdatingPassword(true);
    
    // Slight artificial delay for feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    const res = await updatePassword(data.newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      toast.success('Password changed successfully!');
      reset({
        currentPassword: data.newPassword,
        newPassword: '',
        confirmPassword: '',
      });
    } else {
      toast.error(res.error || 'Failed to update password');
    }
  };

  const displayName = fullName || user?.email?.split('@')[0] || 'Administrator';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-soft">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-luxury shrink-0">
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-black tracking-tight">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-secondary font-medium">
                <Mail className="w-3.5 h-3.5 text-primary" /> {user?.email}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" /> Active Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Account & Profile Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-border shadow-soft flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 border-b border-border pb-4 mb-5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black">Profile Information</h2>
                <p className="text-xs text-secondary">Manage your display name & administrator identity</p>
              </div>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border/80 bg-background/50 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-black font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
                  Email Address (Login Identity)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary/60">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-black/[0.02] text-secondary font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingName}
                  className="px-5 py-2.5 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70 shadow-soft"
                >
                  {isUpdatingName ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Saving Name...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span>Update Profile Name</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60 text-[11px] text-secondary flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Profile name changes reflect instantly across the entire platform.</span>
          </div>
        </motion.div>

        {/* Card 2: Password Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-border shadow-soft"
        >
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black">Security & Password</h2>
              <p className="text-xs text-secondary">Change password with current password preview</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            {/* Current / Previous Password with Preview */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
                  Current Password
                </label>
                <span className="text-[10px] font-semibold text-primary">
                  Preview Available
                </span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter or view current password"
                  {...register('currentPassword')}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-background/50 outline-none transition-all
                    ${errors.currentPassword ? 'border-red-400 focus:border-red-400' : 'border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20'}
                    text-black font-medium`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/70 hover:text-black transition-colors cursor-pointer"
                  title={showCurrentPassword ? "Hide current password" : "Preview current password"}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-[11px] text-red-500 font-medium">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  {...register('newPassword')}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-background/50 outline-none transition-all
                    ${errors.newPassword ? 'border-red-400 focus:border-red-400' : 'border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20'}
                    text-black font-medium`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/70 hover:text-black transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-[11px] text-red-500 font-medium">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-wider uppercase text-secondary/80 block">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  {...register('confirmPassword')}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border bg-background/50 outline-none transition-all
                    ${errors.confirmPassword ? 'border-red-400 focus:border-red-400' : 'border-border/80 focus:border-primary focus:ring-1 focus:ring-primary/20'}
                    text-black font-medium`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/70 hover:text-black transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 shadow-soft"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    <span>Update Security Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
