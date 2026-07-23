import { supabase } from './supabaseClient';
import type { Website, CreateWebsiteInput, UpdateWebsiteInput } from '../types/website';

export const websiteService = {
  /**
   * Fetches all registered websites for the authenticated user.
   */
  async getWebsites(): Promise<Website[]> {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching websites:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetches a specific website registry by ID.
   */
  async getWebsiteById(id: string): Promise<Website> {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching website with ID ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Creates/registers a new website for protection.
   * user_id will default to auth.uid() automatically via DB schema.
   */
  async createWebsite(website: CreateWebsiteInput): Promise<Website> {
    const { data, error } = await supabase
      .from('websites')
      .insert([website])
      .select()
      .single();

    if (error) {
      console.error('Error creating website:', error);
      throw error;
    }

    return data;
  },

  /**
   * Updates an existing website registry.
   */
  async updateWebsite(id: string, website: UpdateWebsiteInput): Promise<Website> {
    const { data, error } = await supabase
      .from('websites')
      .update(website)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating website with ID ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Deletes a registered website from protection.
   * Note: This will cascade delete associated demo links in the database.
   */
  async deleteWebsite(id: string): Promise<void> {
    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting website with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggles the protection status of a website.
   */
  async toggleWebsiteProtection(id: string, isProtected: boolean): Promise<Website> {
    const { data, error } = await supabase
      .from('websites')
      .update({ is_protected: isProtected })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error toggling protection status for website ID ${id}:`, error);
      throw error;
    }

    return data;
  }
};
