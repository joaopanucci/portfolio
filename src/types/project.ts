export type Project = {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  stack: string[];
  status: string;
  github?: string;
  website?: string;
};