export interface Project {
  id: number;
  title: string;
  description: string;
  tech_stack: string[];
  github_url?: string;
  demo_url?: string;
  thumbnail_url?: string;
  is_featured: boolean;
  created_at: string;
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface VisitorStats {
  total: number;
  today: number;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface Profile {
  name: string;
  tagline: string;
  bio: string;
  github_url: string;
  email: string;
  portfolio_url: string;
  avatar_url: string;
  skill_groups: SkillGroup[];
}
