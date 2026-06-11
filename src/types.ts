export type Site = {
  TITLE: string;
  URL: string;
  AUTHOR: string;
  DESCRIPTION: string;
  EMAIL: string;
  TWITTER_HANDLE: string;
  NUM_POSTS_ON_HOMEPAGE: number;
  NUM_PROJECTS_ON_HOMEPAGE: number;
};

export type Metadata = {
  TITLE: string;
  DESCRIPTION: string;
};

export type Socials = {
  NAME: string;
  ICON?: string;
  HREF: string;
}[];
