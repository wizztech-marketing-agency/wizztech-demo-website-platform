import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Loader2, 
  Globe, 
  QrCode, 
  Clock,
  Eye,
  AlertCircle
} from 'lucide-react';
import QRCodeComponent from 'react-qr-code';
// Handle Vite CommonJS/ESM default import mismatch defensively
const QRCode = (QRCodeComponent as any).default || QRCodeComponent;
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useWebsites } from '../../hooks/useWebsites';
import { useDemoLinks, useCreateDemoLink, useDeleteDemoLink } from '../../hooks/useDemoLinks';
import { demoLinkService } from '../../services/demoLinkService';
import type { DemoLink } from '../../types/demoLink';

export const DemoLinks: React.FC = () => {
  const queryClient = useQueryClient();
  // Database website state from React Query
  const { data: websites = [], isLoading: websitesLoading } = useWebsites();

  // Database demo links state from React Query
  const { data: demoLinks = [], isLoading: demoLinksLoading, error: demoLinksError } = useDemoLinks();
  const createDemoLinkMutation = useCreateDemoLink();
  const deleteDemoLinkMutation = useDeleteDemoLink();

  const isGenerating = createDemoLinkMutation.isPending;

  // Selected link for QR display
  const [selectedLinkForQR, setSelectedLinkForQR] = useState<DemoLink | null>(null);

  // Form State
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [expiryPreset, setExpiryPreset] = useState('3600'); // 1 hour default (seconds)
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Set default selected website ID once loaded
  useEffect(() => {
    if (websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id);
    }
  }, [websites, selectedWebsiteId]);

  // Set default selected demo link for QR code display
  useEffect(() => {
    if (demoLinks.length > 0) {
      if (!selectedLinkForQR) {
        setSelectedLinkForQR(demoLinks[0]);
      } else {
        // Keep selected QR code data fresh if query updates it
        const currentSelected = demoLinks.find(link => link.id === selectedLinkForQR.id);
        if (currentSelected) {
          // Only update state if fields have actually changed to avoid loop
          if (
            currentSelected.views_count !== selectedLinkForQR.views_count ||
            currentSelected.expiry_at !== selectedLinkForQR.expiry_at ||
            currentSelected.token !== selectedLinkForQR.token ||
            currentSelected.websites?.name !== selectedLinkForQR.websites?.name ||
            currentSelected.websites?.url !== selectedLinkForQR.websites?.url
          ) {
            setSelectedLinkForQR(currentSelected);
          }
        } else {
          setSelectedLinkForQR(demoLinks[0]);
        }
      }
    } else {
      setSelectedLinkForQR(null);
    }
  }, [demoLinks, selectedLinkForQR]);

  // Token generator helper: short, secure casing-mixed alphanumeric (7-8 chars) without prefixes
  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * 2) + 7; // 7 or 8 characters
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate Demo Link
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebsiteId) return;

    try {
      let expiryParam: string | number = expiryPreset;
      if (expiryPreset === 'custom') {
        if (!customExpiryDate) {
          toast.error('Please choose a custom expiration date');
          return;
        }
        const diffSeconds = Math.max(60, Math.floor((new Date(customExpiryDate).getTime() - Date.now()) / 1000));
        expiryParam = diffSeconds;
      }

      try {
        await demoLinkService.generateDemoLinkViaApi({
          websiteId: selectedWebsiteId,
          expiry: expiryParam
        });
        await queryClient.invalidateQueries({ queryKey: ['demo_links'] });
        toast.success('Demo access link generated successfully');
      } catch (apiErr) {
        console.warn('Backend function unavailable, creating demo link directly:', apiErr);
        let expiryDate: Date;
        if (expiryPreset === 'custom') {
          expiryDate = new Date(customExpiryDate);
        } else {
          const seconds = parseInt(expiryPreset, 10);
          expiryDate = new Date(Date.now() + seconds * 1000);
        }

        const tokenValue = generateRandomToken();
        const newLink = await createDemoLinkMutation.mutateAsync({
          website_id: selectedWebsiteId,
          token: tokenValue,
          expiry_at: expiryDate.toISOString(),
        });

        setSelectedLinkForQR(newLink);
      }
    } catch {
      // Error handling managed by toast
    }
  };

  // Delete Demo Link
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this temporary access link? Access will be blocked instantly.');
    if (!confirmDelete) return;

    try {
      await deleteDemoLinkMutation.mutateAsync(id);
      if (selectedLinkForQR?.id === id) {
        setSelectedLinkForQR(null);
      }
    } catch {
      // Error handling is managed by toast inside the mutation hook
    }
  };

  // Build full redirect link: always uses query parameters (?wz_token=TOKEN) to avoid server routing configuration requirements.
  const buildDemoUrl = (siteUrl: string, token: string) => {
    try {
      const parsed = new URL(siteUrl);
      parsed.searchParams.set('wz_token', token);
      return parsed.toString();
    } catch {
      // Fallback if URL parsing fails
      const separator = siteUrl.includes('?') ? '&' : '?';
      return `${siteUrl}${separator}wz_token=${token}`;
    }
  };

  // Copy helper
  const handleCopy = (fullUrl: string, token: string) => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    toast.success('Demo URL copied to clipboard');
    setTimeout(() => {
      setCopiedToken(null);
    }, 2000);
  };

  const isGlobalLoading = websitesLoading || demoLinksLoading;

  return (
    <div className="space-y-6 fade-in min-h-[calc(100vh-140px)]">
      
      {/* Header Panel */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-2">
          Demo Link Registry
        </h1>
        <p className="text-xs text-secondary mt-0.5">
          Generate temporary client authorization tokens and QR keys
        </p>
      </div>

      {demoLinksError ? (
        <div className="text-center py-16 bg-white border border-red-100 rounded-luxury shadow-soft">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-black">Connection Failure</h3>
          <p className="text-xs text-secondary mt-1 max-w-[320px] mx-auto">
            {demoLinksError.message || 'Unable to retrieve tokens from Supabase. Ensure your database is initialized.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl shadow-luxury cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      ) : websites.length === 0 && !isGlobalLoading ? (
        <div className="p-5 border border-amber-200/50 bg-amber-50/50 rounded-xl flex gap-3 text-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">No websites registered</p>
            <p className="text-amber-700 mt-1">
              You must register a website under the **Protected Websites** tab first before you can generate demo links.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main workspace */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Generate Panel */}
            <form onSubmit={handleGenerate} className="bg-white border border-border p-6 rounded-luxury shadow-soft space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">Token Generator</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Website */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-secondary block">Select Target Website</label>
                  <select
                    value={selectedWebsiteId}
                    onChange={(e) => setSelectedWebsiteId(e.target.value)}
                    disabled={isGenerating || websites.length === 0}
                    className="w-full border border-border rounded-xl text-xs font-semibold px-3 py-2.5 bg-background outline-none focus:border-primary text-black disabled:opacity-50"
                  >
                    {websites.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                {/* Expiry Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-secondary block">Duration Validity</label>
                  <select
                    value={expiryPreset}
                    onChange={(e) => setExpiryPreset(e.target.value)}
                    disabled={isGenerating || websites.length === 0}
                    className="w-full border border-border rounded-xl text-xs font-semibold px-3 py-2.5 bg-background outline-none focus:border-primary text-black disabled:opacity-50"
                  >
                    <option value="1800">30 Minutes</option>
                    <option value="3600">1 Hour</option>
                    <option value="21600">6 Hours</option>
                    <option value="43200">12 Hours</option>
                    <option value="86400">24 Hours</option>
                    <option value="259200">3 Days</option>
                    <option value="604800">7 Days</option>
                    <option value="custom">Custom Date & Time</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Picker */}
              {expiryPreset === 'custom' && (
                <div className="space-y-1 animate-pulse">
                  <label className="text-[10px] font-bold uppercase text-secondary block">Custom Expiry Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={customExpiryDate}
                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                    disabled={isGenerating}
                    className="border border-border rounded-xl text-xs font-semibold px-3 py-2 bg-background outline-none focus:border-primary text-black disabled:opacity-50"
                  />
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || websites.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-black/90 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-luxury cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      <span>Generate Demo Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Generated Links List */}
            <div className="bg-white border border-border rounded-luxury overflow-hidden shadow-soft">
              <div className="p-4 border-b border-border bg-background/30 flex items-center justify-between text-[10px] font-bold text-secondary uppercase tracking-wider">
                <span>Access key & Target URL</span>
                <div className="flex gap-20 pr-8">
                  <span>Views</span>
                  <span>Expiry & Actions</span>
                </div>
              </div>
              
              {isGlobalLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                  <p className="text-[10px] text-secondary font-semibold">Retrieving tokens...</p>
                </div>
              ) : demoLinks.length === 0 ? (
                <div className="text-center py-12">
                  <Link2 className="w-8 h-8 text-secondary/30 mx-auto mb-2.5" />
                  <h4 className="text-xs font-bold text-black">No demo links generated</h4>
                  <p className="text-[10px] text-secondary mt-0.5">Use the generator above to deploy a token.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {demoLinks.map((link) => {
                    const fullUrl = buildDemoUrl(link.websites?.url || '', link.token);
                    const isExpired = new Date(link.expiry_at) <= new Date();

                    return (
                      <div 
                        key={link.id} 
                        onClick={() => setSelectedLinkForQR(link)}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-background/20 transition-all text-xs cursor-pointer ${
                          selectedLinkForQR?.id === link.id ? 'bg-primary/[0.03] border-l-[3px] border-primary' : ''
                        }`}
                      >
                        {/* Token Details */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/10 shrink-0">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono font-bold text-primary truncate">{link.token}</p>
                            <p className="text-[10px] text-secondary mt-0.5 truncate">{link.websites?.name || 'Unknown Website'}</p>
                          </div>
                        </div>

                        {/* Views and Expiry */}
                        <div className="flex items-center justify-between sm:justify-end gap-12 shrink-0">
                          {/* Total Views */}
                          <div className="flex items-center gap-1.5 font-semibold text-black">
                            <Eye className="w-3.5 h-3.5 text-secondary" />
                            <span>{link.views_count} views</span>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Expiry Badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              isExpired 
                                ? 'bg-red-50 text-red-600 border-red-100' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{isExpired ? 'Expired' : new Date(link.expiry_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleCopy(fullUrl, link.token)}
                                disabled={deleteDemoLinkMutation.isPending && deleteDemoLinkMutation.variables === link.id}
                                className="p-1.5 text-secondary hover:text-black rounded-lg border border-border/80 transition-all cursor-pointer bg-white disabled:opacity-50"
                              >
                                {copiedToken === link.token ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button 
                                onClick={() => handleDelete(link.id)}
                                disabled={deleteDemoLinkMutation.isPending && deleteDemoLinkMutation.variables === link.id}
                                className="p-1.5 text-secondary hover:text-red-500 rounded-lg border border-border/80 transition-all cursor-pointer bg-white disabled:opacity-50"
                              >
                                {deleteDemoLinkMutation.isPending && deleteDemoLinkMutation.variables === link.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right workspace: QR Preview Card */}
          <div className="bg-white border border-border p-6 rounded-luxury shadow-soft text-center flex flex-col items-center space-y-4 lg:sticky lg:top-6 select-none">
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
              <QrCode className="w-5 h-5" />
            </div>
            
            {selectedLinkForQR ? (
              <>
                <div>
                  <h3 className="text-xs font-bold text-black">Scan to Authorize</h3>
                  <p className="text-[10px] text-secondary max-w-[200px] mt-0.5">
                    Scan this QR code to instantly open the protected website on this browser session.
                  </p>
                </div>

                <div className="p-4 bg-background border border-border rounded-2xl flex items-center justify-center shadow-soft">
                  <QRCode 
                    value={buildDemoUrl(selectedLinkForQR.websites?.url || '', selectedLinkForQR.token)} 
                    size={130}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-black truncate max-w-[200px]">
                    {selectedLinkForQR.websites?.name || 'Unknown Website'}
                  </p>
                  <p className="text-[9px] font-mono text-secondary truncate max-w-[200px]">
                    {selectedLinkForQR.token}
                  </p>
                </div>
              </>
            ) : (
              <div className="py-12 text-secondary/40 text-xs font-semibold flex flex-col items-center">
                <Globe className="w-8 h-8 mb-2 animate-bounce" />
                <span>Select a demo link to preview its verification QR code</span>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
