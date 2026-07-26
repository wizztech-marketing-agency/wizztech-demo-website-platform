import React from 'react';
import { motion } from 'framer-motion';
import { 
  Link2, 
  Clock, 
  Globe, 
  Cpu, 
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebsites } from '../../hooks/useWebsites';
import { useDemoLinks } from '../../hooks/useDemoLinks';
import toast from 'react-hot-toast';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  delay: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="bg-white border border-border p-6 rounded-luxury shadow-soft hover:shadow-luxury transition-all duration-300"
    >
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold tracking-wider uppercase text-secondary/70">{title}</span>
        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/10">
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-extrabold tracking-tight text-black">{value}</span>
      </div>
    </motion.div>
  );
};

export const DashboardHome: React.FC = () => {
  const queryClient = useQueryClient();

  // Query websites and demo links
  const { data: websites = [], isLoading: websitesLoading, error: websitesError } = useWebsites();
  const { data: demoLinks = [], isLoading: demoLinksLoading, error: demoLinksError } = useDemoLinks();

  const isLoading = websitesLoading || demoLinksLoading;
  const isError = websitesError || demoLinksError;

  const handleSync = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['websites'] }),
        queryClient.invalidateQueries({ queryKey: ['demo_links'] })
      ]);
      toast.success('Dashboard metrics synchronized');
    } catch {
      toast.error('Failed to sync metrics');
    }
  };

  // Calculate metrics
  const totalProtectedWebsites = websites.length;
  
  const now = new Date();
  const activeDemoLinks = demoLinks.filter(link => new Date(link.expiry_at) > now).length;
  const expiredDemoLinks = demoLinks.filter(link => new Date(link.expiry_at) <= now).length;

  // Get top 3 most recent demo links for ledger
  const recentLinks = demoLinks.slice(0, 3);

  if (isError) {
    return (
      <div className="space-y-6 fade-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            System Overview <Cpu className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Real-time status of the central demo validation registry
          </p>
        </div>
        <div className="text-center py-16 bg-white border border-red-100 rounded-luxury shadow-soft">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-black">Sync Failure</h3>
          <p className="text-xs text-secondary mt-1 max-w-[320px] mx-auto">
            Unable to connect to Supabase. Ensure your database tables exist.
          </p>
          <button 
            onClick={handleSync}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl shadow-luxury cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            System Overview <Cpu className="w-5 h-5 text-primary" />
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Real-time status of the central demo validation registry
          </p>
        </div>
        <div>
          <button 
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-secondary hover:text-black transition-all cursor-pointer disabled:opacity-50"
            onClick={handleSync}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Platform</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-border rounded-luxury shadow-soft">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs text-secondary font-semibold">Updating dashboard overview metrics...</p>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Total Protected Websites"
              value={totalProtectedWebsites}
              icon={Globe}
              delay={0}
            />
            <MetricCard
              title="Active Demo Links"
              value={activeDemoLinks}
              icon={Link2}
              delay={0.1}
            />
            <MetricCard
              title="Expired Demo Links"
              value={expiredDemoLinks}
              icon={Clock}
              delay={0.2}
            />
          </div>

          {/* Simplified Recent Registry Ledger */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border border-border p-6 rounded-luxury shadow-soft"
          >
            <div className="mb-5">
              <h3 className="text-sm font-bold text-black">Active Validation Ledger</h3>
              <p className="text-[11px] text-secondary">The latest demo link creations and open counts</p>
            </div>

            {recentLinks.length === 0 ? (
              <div className="text-center py-8 text-secondary/40 text-xs font-semibold">
                No links registered in database yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentLinks.map((link) => {
                  const isExpired = new Date(link.expiry_at) <= now;

                  return (
                    <div key={link.id} className="py-4 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/10 shrink-0">
                          <Link2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-black truncate">{link.websites?.name || 'Unknown Website'}</p>
                          <p className="text-[10px] font-mono text-secondary mt-0.5 truncate">{link.token}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-black">{link.views_count} opens</p>
                          <p className="text-[9px] text-secondary mt-0.5">Total View Count</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          !isExpired
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {!isExpired ? 'Active' : 'Expired'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}

    </div>
  );
};
