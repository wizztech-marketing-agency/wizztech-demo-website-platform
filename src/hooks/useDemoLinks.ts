import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demoLinkService } from '../services/demoLinkService';
import type { DemoLink, CreateDemoLinkInput } from '../types/demoLink';
import toast from 'react-hot-toast';

/**
 * Hook to retrieve all generated demo links.
 */
export const useDemoLinks = () => {
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
