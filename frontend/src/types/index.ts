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

export interface YearlyGoal {
  text: string;
  done: boolean;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  tags: string[];
  thumbnail_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  acquired_date: string | null;
  credential_url: string;
  order: number;
}

export interface Organization {
  id: number;
  name: string;
  institution: string;
  role: string;
  period: string;
  description: string;
  logo_url: string;
  link_url: string;
}

export interface Profile {
  name: string;
  tagline: string;
  bio: string;
  github_url: string;
  email: string;
  portfolio_url: string;
  avatar_url: string;
  discord: string;
  cv_url: string;
  og_image_url: string;
  skill_groups: SkillGroup[];
  yearly_goals: YearlyGoal[];
  marquee_items: string[];
}
