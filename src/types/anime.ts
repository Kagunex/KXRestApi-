export interface Anime {
  id: string;
  slug: string;
  title: string;
  alternativeTitles: string[];
  thumbnail: string | null;
  type: string | null;
  status: string | null;
  released: string | null;
  duration: string | null;
  season: string | null;
  studio: string | null;
  producers: string[];
  genres: string[];
  synopsis: string | null;
  episodeCount: number | null;
}

export interface AnimeSearchResult {
  id: string;
  slug: string;
  title: string;
  url: string;
  thumbnail: string | null;
  type: string | null;
  status: string | null;
  latestEpisode: string | null;
}

export interface Episode {
  id: string;
  animeId: string;
  number: number | null;
  title: string;
  slug: string;
  url: string;
  thumbnail: string | null;
  releasedAt: string | null;
}

export interface Genre {
  name: string;
  slug: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}

export type ErrorCode =
  | "INVALID_REQUEST"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SOURCE_ERROR"
  | "SOURCE_UNAVAILABLE";
