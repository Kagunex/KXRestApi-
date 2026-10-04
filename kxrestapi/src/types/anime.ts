export interface AnimeSearchResult {
  id: string;
  title: string;
  slug: string;
  url: string;
  thumbnail: string;
  type: string;
  status: string;
  latestEpisode: string;
}

export interface Episode {
  number: number;
  title: string;
  slug: string;
}

export interface Anime {
  id: string;
  title: string;
  alternativeTitles: string[];
  thumbnail: string;
  type: string;
  status: string;
  score: string;
  genres: string[];
  synopsis: string;
  episodes: Episode[];
  slug: string;
}

export interface Genre {
  name: string;
  slug: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  query?: string;
  count?: number;
  anime?: { slug: string; title: string };
  responseTime?: number;
  name?: string;
  status?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
