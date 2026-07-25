import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Plus, 
  Globe, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Loader2, 
  Check,
  AlertCircle,
  ExternalLink,
  Clock,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  useWebsites, 
  useCreateWebsite, 
  useUpdateWebsite, 
  useDeleteWebsite, 
  useToggleWebsiteProtection 
} from '../../hooks/useWebsites';
import { demoLinkService } from '../../services/demoLinkService';
import type { Website } from '../../types/website';

const websiteSchema = z.object({
  name: z.string().min(1, 'Website name is required'),
  url: z.string().url('Must be a valid URL starting with http:// or https://'),
  is_protected: z.boolean(),
});

type WebsiteFormValues = z.infer<typeof websiteSchema>;

export const Websites: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);

  // Modal States
  const [openWebsiteModalSite, setOpenWebsiteModalSite] = useState<Website | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('30m');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const [toggleConfirmSite, setToggleConfirmSite] = useState<Website | null>(null);

  // React Query Hooks
  const { data: websites = [], isLoading: loading, error } = useWebsites();
  const createWebsiteMutation = useCreateWebsite();
  const updateWebsiteMutation = useUpdateWebsite();
  const deleteWebsiteMutation = useDeleteWebsite();
  const toggleProtectionMutation = useToggleWebsiteProtection();

  const isSaving = createWebsiteMutation.isPending || updateWebsiteMutation.isPending;

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      name: '',
      url: '',
      is_protected: true,
    },
  });

  // Open drawer for adding
  const handleOpenAdd = () => {
    setEditingWebsite(null);
    reset({
      name: '',
      url: '',
      is_protected: true,
    });
    setIsDrawerOpen(true);
  };

  // Open drawer for editing
  const handleOpenEdit = (site: Website) => {
    setEditingWebsite(site);
    setValue('name', site.name);
    setValue('url', site.url);
    setValue('is_protected', site.is_protected);
    setIsDrawerOpen(true);
  };

  // Create or Update
  const onSubmit = async (data: WebsiteFormValues) => {
    try {
      if (editingWebsite) {
        await updateWebsiteMutation.mutateAsync({
          id: editingWebsite.id,
          data: {
            name: data.name,
            url: data.url,
            is_protected: data.is_protected,
          },
        });
      } else {
        await createWebsiteMutation.mutateAsync({
          name: data.name,
          url: data.url,
          is_protected: data.is_protected,
        });
      }
      setIsDrawerOpen(false);
    } catch {
      // Errors handled by toast mutation hooks
    }
  };

  // Delete Website
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to remove this website? All active demo links associated with it will also be deleted.'
    );
    if (!confirmDelete) return;

    try {
      await deleteWebsiteMutation.mutateAsync(id);
    } catch {
      // Errors handled by toast mutation hooks
    }
  };

  // Initiate Open Website modal
  const handleInitiateOpenWebsite = (site: Website) => {
    setOpenWebsiteModalSite(site);
    setSelectedExpiry('30m');
  };

  // Confirm Open Website with selected duration via backend API
  const handleConfirmOpenWebsite = async () => {
    if (!openWebsiteModalSite) return;
    try {
      setIsGeneratingLink(true);
      const res = await demoLinkService.generateDemoLinkViaApi({
        websiteId: openWebsiteModalSite.id,
        expiry: selectedExpiry
      });

      if (res.demoUrl) {
        window.open(res.demoUrl, '_blank');
        toast.success('Secure demo URL generated & website opened');
      }
      setOpenWebsiteModalSite(null);
    } catch (err: any) {
      console.error('Error generating demo link:', err);
      toast.error(err.message || 'Failed to generate demo link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Initiate Toggle Protection Modal
  const handleInitiateToggleProtection = (site: Website) => {
    setToggleConfirmSite(site);
  };

  // Confirm Toggle Protection
  const handleConfirmToggleProtection = async () => {
    if (!toggleConfirmSite) return;
    try {
      await toggleProtectionMutation.mutateAsync({
        id: toggleConfirmSite.id,
        isProtected: !toggleConfirmSite.is_protected,
      });
      setToggleConfirmSite(null);
    } catch {
      // Errors handled by toast mutation hooks
    }
  };

  // Filtering
  const filteredWebsites = websites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in relative min-h-[calc(100vh-140px)]">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
            Protected Websites
          </h1>
          <p className="text-xs text-secondary mt-0.5">
            Register and manage customer websites needing demo validation protection
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-luxury cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Register Website</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glassmorphism p-3.5 rounded-xl flex items-center gap-3">
        <Search className="w-4 h-4 text-secondary/60" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter registered websites by name or URL..." 
          className="bg-transparent border-none outline-none text-xs text-black placeholder:text-secondary/40 w-full font-medium"
        />
      </div>

      {/* Data Table / States */}
      {error ? (
        <div className="text-center py-16 bg-white border border-red-100 rounded-luxury shadow-soft">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-black">Connection Failure</h3>
          <p className="text-xs text-secondary mt-1 max-w-[320px] mx-auto">
            {error.message || 'Unable to retrieve registry from Supabase. Ensure your database is initialized.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl shadow-luxury cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-xs text-secondary font-semibold">Retrieving website registries from database...</p>
        </div>
      ) : filteredWebsites.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-luxury shadow-soft">
          <Globe className="w-10 h-10 text-secondary/30 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-black">No websites registered</h3>
          <p className="text-xs text-secondary mt-1 max-w-[280px] mx-auto">
            {searchQuery ? 'No websites match your filter query.' : 'Register your first deployment to start protecting client domains.'}
          </p>
          {!searchQuery && (
            <button 
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl shadow-luxury cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-primary" /> Get Started
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-luxury overflow-hidden shadow-soft">
          {/* Desktop Table Headers */}
          <div className="hidden md:flex p-4 border-b border-border bg-background/30 text-[10px] font-bold text-secondary uppercase tracking-wider justify-between items-center">
            <span className="w-[35%]">Website Detail</span>
            <span className="w-[15%] text-center">Status</span>
            <span className="w-[15%] text-center">Registered Date</span>
            <span className="w-[35%] text-right pr-4">Actions</span>
          </div>

          {/* List/Rows */}
          <div className="divide-y divide-border">
            {filteredWebsites.map((site) => (
              <div 
                key={site.id} 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-background/20 transition-all text-xs"
              >
                {/* 1. Detail */}
                <div className="flex items-center gap-3 md:w-[35%] min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-black truncate">{site.name}</p>
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-secondary hover:text-primary transition-colors truncate block mt-0.5"
                    >
                      {site.url}
                    </a>
                  </div>
                </div>

                {/* 2. Protection Toggle */}
                <div className="flex md:justify-center items-center gap-2.5 md:w-[15%]">
                  <button
                    disabled={toggleProtectionMutation.isPending && toggleProtectionMutation.variables?.id === site.id}
                    onClick={() => handleInitiateToggleProtection(site)}
                    title="Click to toggle protection state"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all cursor-pointer font-bold text-[10px] disabled:opacity-50 ${
                      site.is_protected 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300' 
                        : 'bg-secondary/5 text-secondary border-border hover:border-secondary/30'
                    }`}
                  >
                    {toggleProtectionMutation.isPending && toggleProtectionMutation.variables?.id === site.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{site.is_protected ? 'Protected' : 'Unprotected'}</span>
                  </button>
                </div>

                {/* 3. Date */}
                <div className="flex md:justify-center text-secondary md:w-[15%] font-medium">
                  {new Date(site.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </div>

                {/* 4. Action buttons */}
                <div className="flex items-center justify-end gap-1.5 md:w-[35%] pr-2">
                  <button
                    onClick={() => handleInitiateOpenWebsite(site)}
                    title="Select duration & open website via backend demo token"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-black text-white hover:bg-black/90 active:scale-[0.98] transition-all cursor-pointer shadow-luxury"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-primary" />
                    <span>Open Website</span>
                  </button>
                  <button 
                    disabled={deleteWebsiteMutation.isPending && deleteWebsiteMutation.variables === site.id}
                    onClick={() => handleOpenEdit(site)}
                    title="Edit website details"
                    className="p-2 text-secondary hover:text-black rounded-lg border border-border/80 transition-all cursor-pointer bg-white disabled:opacity-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    disabled={deleteWebsiteMutation.isPending && deleteWebsiteMutation.variables === site.id}
                    onClick={() => handleDelete(site.id)}
                    title="Delete website"
                    className="p-2 text-secondary hover:text-red-500 rounded-lg border border-border/80 transition-all cursor-pointer bg-white disabled:opacity-50"
                  >
                    {deleteWebsiteMutation.isPending && deleteWebsiteMutation.variables === site.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. Open Website Duration Selection Modal */}
      <AnimatePresence>
        {openWebsiteModalSite && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isGeneratingLink && setOpenWebsiteModalSite(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-black">Select Demo Access Duration</h3>
                      <p className="text-[10px] text-secondary">{openWebsiteModalSite.name}</p>
                    </div>
                  </div>
                  <button
                    disabled={isGeneratingLink}
                    onClick={() => setOpenWebsiteModalSite(null)}
                    className="p-1 rounded-lg border border-border text-secondary hover:bg-black/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
                    Temporary Token Validity Period
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '30 Minutes', value: '30m' },
                      { label: '1 Hour', value: '1h' },
                      { label: '6 Hours', value: '6h' },
                      { label: '12 Hours', value: '12h' },
                      { label: '24 Hours', value: '24h' },
                      { label: '3 Days', value: '3d' },
                      { label: '7 Days', value: '7d' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedExpiry(opt.value)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                          selectedExpiry === opt.value
                            ? 'border-primary bg-primary/5 text-black shadow-sm'
                            : 'border-border bg-background/50 text-secondary hover:border-black/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    disabled={isGeneratingLink}
                    onClick={() => setOpenWebsiteModalSite(null)}
                    className="flex-1 py-2.5 border border-border text-xs font-semibold text-secondary rounded-xl hover:bg-black/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingLink}
                    onClick={handleConfirmOpenWebsite}
                    className="flex-1 py-2.5 bg-black text-white text-xs font-semibold rounded-xl hover:bg-black/90 transition-all flex items-center justify-center gap-2 shadow-luxury"
                  >
                    {isGeneratingLink ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        <span>Generate & Open</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Protection Toggle Confirmation Modal */}
      <AnimatePresence>
        {toggleConfirmSite && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !toggleProtectionMutation.isPending && setToggleConfirmSite(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 select-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-black">
                    {toggleConfirmSite.is_protected ? 'Disable Website Protection' : 'Enable Website Protection'}
                  </h3>
                  <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                    {toggleConfirmSite.is_protected
                      ? 'This website will become publicly accessible.'
                      : 'Visitors will require a valid demo link to access this website.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={toggleProtectionMutation.isPending}
                    onClick={() => setToggleConfirmSite(null)}
                    className="flex-1 py-2.5 border border-border text-xs font-semibold text-secondary rounded-xl hover:bg-black/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={toggleProtectionMutation.isPending}
                    onClick={handleConfirmToggleProtection}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-luxury text-white ${
                      toggleConfirmSite.is_protected ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-black/90'
                    }`}
                  >
                    {toggleProtectionMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>{toggleConfirmSite.is_protected ? 'Disable Protection' : 'Enable Protection'}</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Right Panel Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSaving && setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-md"
            />

            {/* Slide drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] z-50 bg-white border-l border-border shadow-luxury flex flex-col p-6 overflow-y-auto select-none"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold text-black">
                    {editingWebsite ? 'Edit Website' : 'Register Website'}
                  </h3>
                </div>
                <button
                  disabled={isSaving}
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg border border-border/80 hover:bg-black/5 transition-all text-secondary disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Website Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-secondary block">
                      Website Name
                    </label>
                    <input 
                      type="text"
                      disabled={isSaving}
                      placeholder="e.g., Acme Corporation"
                      {...register('name')}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background outline-none transition-all duration-200 
                        ${errors.name ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary'}
                        text-black placeholder:text-secondary/40 font-semibold disabled:opacity-50`}
                    />
                    {errors.name && (
                      <p className="text-[10px] text-red-500 font-medium">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Production URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider uppercase text-secondary block">
                      Main Production URL
                    </label>
                    <input 
                      type="text"
                      disabled={isSaving}
                      placeholder="https://acmecorp.com"
                      {...register('url')}
                      className={`w-full px-3.5 py-2.5 text-xs rounded-xl border bg-background outline-none transition-all duration-200 
                        ${errors.url ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary'}
                        text-black placeholder:text-secondary/40 font-semibold disabled:opacity-50`}
                    />
                    {errors.url && (
                      <p className="text-[10px] text-red-500 font-medium">{errors.url.message}</p>
                    )}
                  </div>

                  {/* Protection Status Switch */}
                  <div className="p-4 rounded-xl border border-border bg-background/40 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <label className="text-[11px] font-bold text-black flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-primary" /> Active Protection
                      </label>
                      <p className="text-[9px] text-secondary">
                        Validate visitors with this platform before opening.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        disabled={isSaving}
                        {...register('is_protected')} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>


                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-border mt-auto">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-3 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-luxury flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-primary" />
                        <span>Save Website</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
