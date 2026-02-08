export interface UserProfile {
  username: string;
  avatarUrl: string | null;
}

export interface ContentData {
  title: string;
  body: string;
}

export interface PageConfig {
  paddingX: number;
  paddingY: number;
  titleSize: number;
  bodySize: number;
  lineHeight: number;
  width: number;
  height: number;
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW'
}
