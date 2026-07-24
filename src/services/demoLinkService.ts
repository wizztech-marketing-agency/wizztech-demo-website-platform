import { supabase } from './supabaseClient';
import type { DemoLink, CreateDemoLinkInput } from '../types/demoLink';

export interface GenerateDemoLinkResponse {
  status: string;
  demoUrl: string;
  rawToken: string;
  expiresAt: string;
}

export const demoLinkService = {
  /**
   * Calls the dedicated backend endpoint to generate a secure, SHA-256 hashed demo link.
   */
  async generateDemoLinkViaApi(params: { websiteId: string; expiry: string }): Promise<GenerateDemoLinkResponse> {
    const response = await fetch('/.netlify/functions/generate-demo-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to generate secure demo link via server API');
    }

    return response.json();
  },

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
   * Generates/registers a new temporary demo link directly via Supabase.
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
