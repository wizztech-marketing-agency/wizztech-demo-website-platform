import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demoLinkService } from '../services/demoLinkService';
import { supabase } from '../services/supabaseClient';
import type { DemoLink, CreateDemoLinkInput } from '../types/demoLink';
import toast from 'react-hot-toast';

/**
 * Hook to retrieve all generated demo links.
 */
export const useDemoLinks = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Generate a unique channel ID to prevent duplicate subscription errors on re-mounts
    const channelId = `realtime_demo_links_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demo_links' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['demo_links'] });
        }
      );

    try {
      channel.subscribe();
    } catch (e) {
      console.warn('Realtime channel subscription error:', e);
    }

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn(e);
      }
    };
  }, [queryClient]);

  return useQuery<DemoLink[], Error>({
    queryKey: ['demo_links'],
    queryFn: demoLinkService.getDemoLinks,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to generate a new temporary demo link.
 */
export const useCreateDemoLink = () => {
  const queryClient = useQueryClient();

  return useMutation<DemoLink, Error, CreateDemoLinkInput>({
    mutationFn: demoLinkService.createDemoLink,
    onSuccess: () => {
      // Invalidate demo links query cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['demo_links'] });
      toast.success('Demo access link generated successfully');
    },
    onError: (error) => {
      console.error('Create demo link mutation error:', error);
      toast.error(error.message || 'Failed to generate demo link');
    },
  });
};

/**
 * Hook to delete a temporary demo link.
 */
export const useDeleteDemoLink = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: demoLinkService.deleteDemoLink,
    onSuccess: () => {
      // Invalidate demo links query cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['demo_links'] });
      toast.success('Access link deleted successfully');
    },
    onError: (error) => {
      console.error('Delete demo link mutation error:', error);
      toast.error(error.message || 'Failed to delete demo link');
    },
  });
};
