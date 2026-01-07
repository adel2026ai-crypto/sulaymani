
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
  aboutMarib: string;
  aboutSheikh: string;
}

export type ViewState = 'home' | 'search' | 'library' | 'profile' | 'detail' | 'search_view';
