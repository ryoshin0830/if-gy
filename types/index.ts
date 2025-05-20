// types/index.ts

export interface ShortenedUrl {
    id: number;
    original_url: string;
    custom_path?: string | null;
    created_at: Date;
    visits: number;
  }
  
  export interface UploadedFile {
    id: number;
    blob_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
    custom_path?: string | null;
    created_at: Date;
    downloads: number;
  }
  
  export interface ApiResponse {
    shortUrl?: string;
    customPath?: string;
    error?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  }

  export interface VerifyPasskeyResponse {
    success?: boolean;
    token?: string;
    error?: string;
  }

  export interface UrlsResponse {
    urls?: ShortenedUrl[];
    error?: string;
  }

  export interface FilesResponse {
    files?: UploadedFile[];
    error?: string;
  }

  export interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
  }