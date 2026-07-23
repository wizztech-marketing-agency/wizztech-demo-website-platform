export interface Website {
  id: string;
  name: string;
  url: string;
  is_protected: boolean;
  created_at: string;
  user_id: string;
}

export type CreateWebsiteInput = Omit<Website, 'id' | 'created_at' | 'user_id'>;
export type UpdateWebsiteInput = Partial<CreateWebsiteInput>;
