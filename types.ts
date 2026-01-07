
export type ContentType = 'book' | 'audio' | 'video' | 'fatwa';

export interface ContentItem {
  id: string;
  title: string;
  author: string;
  description: string;
  type: ContentType;
  coverImage: string;
  sourceUrl: string;
  duration?: string;
  mainCategory: string; 
  subCategory: string;  
  seriesTitle?: string; 
  volumeNumber?: number; 
  createdAt: number;
}

export interface SiteInfo {
  siteName?: string;
  siteDescription?: string;
  aboutMarib: string;
  aboutSheikh: string;
  maintenanceMode?: boolean;
}

export type ViewState = 'home' | 'search' | 'library' | 'profile' | 'detail' | 'search_view';
