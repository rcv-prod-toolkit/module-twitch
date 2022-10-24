export interface User {
  data: Data[];
}

export interface Data {
  broadcaster_type: string;
  created_at: Date;
  description: string;
  display_name: string;
  id: string;
  login: string;
  offline_image_url: string;
  profile_image_url: string;
  type: string;
  view_count: number;
}
