import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService } from '../services/websiteService';
import type { Website, CreateWebsiteInput, UpdateWebsiteInput } from '../types/website';
import toast from 'react-hot-toast';

/**
 * Hook to retrieve all registered websites.
 */
export const useWebsites = () => {
  return useQuery<Website[], Error>({
    queryKey: ['websites'],
    queryFn: websiteService.getWebsites,
  });
};

/**
 * Hook to retrieve a specific website by ID.
 */
export const useWebsite = (id: string) => {
  return useQuery<Website, Error>({
    queryKey: ['websites', id],
    queryFn: () => websiteService.getWebsiteById(id),
    enabled: !!id,
  });
};

/**
 * Hook to register a new website for protection.
 */
export const useCreateWebsite = () => {
  const queryClient = useQueryClient();

  return useMutation<Website, Error, CreateWebsiteInput>({
    mutationFn: websiteService.createWebsite,
    onSuccess: () => {
      // Invalidate websites query cache to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      toast.success('Website registered successfully');
    },
    onError: (error) => {
      console.error('Create website mutation error:', error);
      toast.error(error.message || 'Failed to register website');
    },
  });
};

/**
 * Hook to update an existing website registry.
 */
export const useUpdateWebsite = () => {
  const queryClient = useQueryClient();

  return useMutation<Website, Error, { id: string; data: UpdateWebsiteInput }>({
    mutationFn: ({ id, data }) => websiteService.updateWebsite(id, data),
    onSuccess: (updatedWebsite) => {
      // Invalidate specific website queries and the full list query
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      queryClient.invalidateQueries({ queryKey: ['websites', updatedWebsite.id] });
      // Invalidate demo links as the website details might have changed
      queryClient.invalidateQueries({ queryKey: ['demo_links'] });
      toast.success('Website details updated');
    },
    onError: (error) => {
      console.error('Update website mutation error:', error);
      toast.error(error.message || 'Failed to update website');
    },
  });
};

/**
 * Hook to delete a registered website.
 */
export const useDeleteWebsite = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: websiteService.deleteWebsite,
    onSuccess: () => {
      // Invalidate queries to update lists
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      // Demo links have cascade deletion on DB level, so we must invalidate demo links query too
      queryClient.invalidateQueries({ queryKey: ['demo_links'] });
      toast.success('Website deleted successfully');
    },
    onError: (error) => {
      console.error('Delete website mutation error:', error);
      toast.error(error.message || 'Failed to delete website');
    },
  });
};

/**
 * Hook to toggle protection status inline.
 */
export const useToggleWebsiteProtection = () => {
  const queryClient = useQueryClient();

  return useMutation<Website, Error, { id: string; isProtected: boolean }>({
    mutationFn: ({ id, isProtected }) => websiteService.toggleWebsiteProtection(id, isProtected),
    onSuccess: (updatedWebsite, variables) => {
      queryClient.invalidateQueries({ queryKey: ['websites'] });
      queryClient.invalidateQueries({ queryKey: ['websites', updatedWebsite.id] });
      toast.success(
        `Protection ${variables.isProtected ? 'activated' : 'disabled'} for ${updatedWebsite.name}`
      );
    },
    onError: (error) => {
      console.error('Toggle protection status error:', error);
      toast.error(error.message || 'Failed to toggle protection status');
    },
  });
};
