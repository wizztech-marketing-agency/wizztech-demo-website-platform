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
   * Passes the current user's auth token so the Netlify function can INSERT with proper
   * RLS authentication (the "authenticated" INSERT policy applies).
   */
  async generateDemoLinkViaApi(params: { websiteId: string; expiry: string }): Promise<GenerateDemoLinkResponse> {
    // Get the current user session so we can pass the access token to the server function
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Pass the auth token in the Authorization header so the Netlify function
    // can create a Supabase client authenticated as this user
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log('[demoLinkService] generateDemoLinkViaApi called');
    console.log('[demoLinkService] Has auth token:', !!accessToken);
    console.log('[demoLinkService] Params:', params);

    const response = await fetch('/.netlify/functions/generate-demo-link', {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });

    const responseData = await response.json().catch(() => ({}));
    console.log('[demoLinkService] Response status:', response.status);
    console.log('[demoLinkService] Response data:', responseData);

    if (!response.ok) {
      throw new Error(responseData.message || responseData.detail || 'Failed to generate secure demo link via server API');
    }

    return responseData;
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
