import { supabase } from './supabaseClient';
import type { DemoLink, CreateDemoLinkInput } from '../types/demoLink';

export const demoLinkService = {
  /**
   * Fetches all registered demo links for the authenticated user,
   * including the associated website's name and URL details.
   */
  async getDemoLinks(): Promise<DemoLink[]> {
    const { data, error } = await supabase
      .from('demo_links')
      .select('*, websites(name, url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching demo links:', error);
      throw error;
    }

    return (data as DemoLink[]) || [];
  },

  /**
   * Generates/registers a new temporary demo link.
   * created_by will default to auth.uid() automatically via DB schema.
   */
  async createDemoLink(demoLink: CreateDemoLinkInput): Promise<DemoLink> {
    const { data, error } = await supabase
      .from('demo_links')
      .insert([demoLink])
      .select('*, websites(name, url)')
      .single();

    if (error) {
      console.error('Error creating demo link:', error);
      throw error;
    }

    return data as DemoLink;
  },

  /**
   * Deletes a temporary demo link, revoking client access instantly.
   */
  async deleteDemoLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('demo_links')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting demo link with ID ${id}:`, error);
      throw error;
    }
  }
};
