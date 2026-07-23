export interface DemoLink {
  id: string;
  website_id: string;
  token: string;
  expiry_at: string;
  views_count: number;
  created_at: string;
  created_by: string;
  websites: {
    name: string;
    url: string;
  } | null;
}

export type CreateDemoLinkInput = Omit<DemoLink, 'id' | 'views_count' | 'created_at' | 'created_by' | 'websites'>;
