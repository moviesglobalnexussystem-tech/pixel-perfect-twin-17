// Admin mock data

export interface SeriesItem {
  id: string;
  name: string;
  posterUrl: string;
  description: string;
  isPopular: boolean;
  isComingSoon: boolean;
  dramaSelectionPosition: number | null;
  categories: string[];
  genre: string;
  actors: string;
  isTopTen: boolean;
  isHotDrama: boolean;
  isOriginal: boolean;
  isVip: boolean;
  rating: number;
  totalEpisodes: number;
  displayOrder: number;
  createdAt: string;
}

export interface MovieItem {
  id: string;
  name: string;
  posterUrl: string;
  description: string;
  streamLink: string;
  downloadLink: string;
  isPopular: boolean;
  isComingSoon: boolean;
  categories: string[];
  genre: string;
  actors: string;
  isTopTen: boolean;
  isHotDrama: boolean;
  isOriginal: boolean;
  isVip: boolean;
  isAgent: boolean;
  agentMarkedAt: string | null;
  rating: number;
  displayOrder: number;
  createdAt: string;
}

export interface EpisodeItem {
  id: string;
  seriesId: string;
  seriesName: string;
  name: string;
  seasonNumber: number;
  episodeNumber: number;
  streamLink: string;
  downloadLink: string;
  isAgent: boolean;
  agentMarkedAt: string | null;
  createdAt: string;
}

export interface LatestUpdateItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  contentId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface WatchLaterItem {
  id: string;
  userId: string;
  contentId: string;
  contentTitle: string;
  contentImage: string;
  contentType: "movie" | "series" | "episode";
  createdAt: string;
}

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  hotWord: string;
  imageUrl: string;
  linkType: "series" | "episode" | "live-match" | "tv-channel" | "agent-plan" | "movie" | "live-sport" | "latest-update";
  linkId: string;
  isActive: boolean;
  page?: "home" | "series" | "movies";
  createdAt: string;
}

export interface TVChannelItem {
  id: string;
  name: string;
  logoUrl: string;
  streamLink: string;
  category: string;
  isLive: boolean;
  description: string;
  createdAt: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  action: string;
  details: string;
  page: string;
  timestamp: string;
  ip: string;
  device: string;
}

export interface AgentItem {
  id: string;
  name: string;
  phone: string;
  agentId: string;
  balance: number;
  sharedMovies: number;
  sharedSeries: number;
  totalEarnings: number;
  status: "active" | "blocked" | "expired";
  plan: string;
  planExpiry: string;
  createdAt: string;
}

export interface UserItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "blocked" | "inactive";
  subscription: string | null;
  subscriptionExpiry: string | null;
  lastActive: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: "deposit" | "withdrawal" | "subscription" | "agent-share";
  amount: number;
  status: "completed" | "pending" | "failed";
  method: string;
  createdAt: string;
}

// Mock data generators
export const mockSeries: SeriesItem[] = [
  { id: "s1", name: "Eternal Love of the Fox", posterUrl: "", description: "A timeless love story spanning centuries", isPopular: true, isComingSoon: false, dramaSelectionPosition: 1, categories: ["Sweet Romance", "Ancient Costume"], genre: "Romance, Fantasy, Drama", actors: "Yang Mi, Mark Chao, Dilraba Dilmurat", isTopTen: true, isHotDrama: true, isOriginal: true, isVip: true, rating: 9.2, totalEpisodes: 38, displayOrder: 0, createdAt: "2025-12-01" },
  { id: "s2", name: "Dating with You", posterUrl: "", description: "Modern romance in the digital age", isPopular: true, isComingSoon: false, dramaSelectionPosition: 2, categories: ["Sweet Romance"], genre: "Romance, Comedy", actors: "Zhao Lusi, Lin Yi", isTopTen: false, isHotDrama: true, isOriginal: false, isVip: false, rating: 8.5, totalEpisodes: 30, displayOrder: 0, createdAt: "2025-11-15" },
  { id: "s3", name: "The Best Thing", posterUrl: "", description: "Finding the best in life and love", isPopular: false, isComingSoon: true, dramaSelectionPosition: null, categories: ["High Quality Dramas"], genre: "Drama, Romance", actors: "Zhang Xincheng, Liang Jie", isTopTen: false, isHotDrama: false, isOriginal: true, isVip: true, rating: 8.8, totalEpisodes: 24, displayOrder: 0, createdAt: "2025-10-20" },
  { id: "s4", name: "Ultimate Note", posterUrl: "", description: "An adventure into the unknown", isPopular: true, isComingSoon: false, dramaSelectionPosition: 3, categories: ["High Quality Dramas"], genre: "Adventure, Mystery, Thriller", actors: "Joseph Zeng, Liu Yuning", isTopTen: true, isHotDrama: false, isOriginal: false, isVip: true, rating: 9.0, totalEpisodes: 40, displayOrder: 0, createdAt: "2025-09-10" },
];

export const mockMovies: MovieItem[] = [
  { id: "m1", name: "Moonlight Fantasy", posterUrl: "", description: "A magical moonlit adventure", streamLink: "https://stream.example.com/m1", downloadLink: "", isPopular: true, isComingSoon: false, categories: ["Sweet Romance"], genre: "Fantasy, Romance", actors: "Yang Zi, Xiao Zhan", isTopTen: true, isHotDrama: true, isOriginal: true, isVip: true, isAgent: false, agentMarkedAt: null, rating: 9.1, displayOrder: 0, createdAt: "2025-12-05" },
  { id: "m2", name: "Detective Mystery", posterUrl: "", description: "Unraveling the greatest case", streamLink: "https://stream.example.com/m2", downloadLink: "", isPopular: true, isComingSoon: false, categories: ["High Quality Dramas"], genre: "Mystery, Thriller", actors: "Bai Yu, Zhu Yilong", isTopTen: false, isHotDrama: true, isOriginal: false, isVip: false, isAgent: false, agentMarkedAt: null, rating: 8.7, displayOrder: 0, createdAt: "2025-11-20" },
];

export const mockEpisodes: EpisodeItem[] = [
  { id: "e1", seriesId: "s1", seriesName: "Eternal Love of the Fox", name: "The Beginning", seasonNumber: 1, episodeNumber: 1, streamLink: "https://stream.example.com/s1e1", downloadLink: "", isAgent: false, agentMarkedAt: null, createdAt: "2025-12-01" },
  { id: "e2", seriesId: "s1", seriesName: "Eternal Love of the Fox", name: "Memories Awaken", seasonNumber: 1, episodeNumber: 2, streamLink: "https://stream.example.com/s1e2", downloadLink: "", isAgent: false, agentMarkedAt: null, createdAt: "2025-12-02" },
  { id: "e3", seriesId: "s2", seriesName: "Dating with You", name: "First Date", seasonNumber: 1, episodeNumber: 1, streamLink: "https://stream.example.com/s2e1", downloadLink: "", isAgent: false, agentMarkedAt: null, createdAt: "2025-11-15" },
  { id: "e4", seriesId: "s4", seriesName: "Ultimate Note", name: "Into the Tomb", seasonNumber: 1, episodeNumber: 1, streamLink: "https://stream.example.com/s4e1", downloadLink: "", isAgent: false, agentMarkedAt: null, createdAt: "2025-09-10" },
];

export const mockCarousels: CarouselItem[] = [
  { id: "c1", title: "Eternal Love of the Fox", subtitle: "New Episodes Every Friday", hotWord: "HOT", imageUrl: "", linkType: "series", linkId: "s1", isActive: true, createdAt: "2025-12-01" },
  { id: "c2", title: "Live Football Match", subtitle: "Premier League Tonight", hotWord: "LIVE", imageUrl: "", linkType: "live-match", linkId: "match1", isActive: true, createdAt: "2025-12-05" },
];

export const mockTVChannels: TVChannelItem[] = [
  { id: "tv1", name: "iQIYI Drama", logoUrl: "", streamLink: "https://stream.example.com/tv1", category: "Drama", isLive: true, description: "24/7 Drama channel", createdAt: "2025-10-01" },
  { id: "tv2", name: "iQIYI Sports", logoUrl: "", streamLink: "https://stream.example.com/tv2", category: "Sports", isLive: true, description: "Live sports coverage", createdAt: "2025-10-01" },
  { id: "tv3", name: "iQIYI Movies", logoUrl: "", streamLink: "https://stream.example.com/tv3", category: "Movies", isLive: false, description: "Movie channel", createdAt: "2025-10-15" },
];

export const mockActivities: UserActivity[] = [
  { id: "a1", userId: "u1", userName: "John Doe", userPhone: "+256700111222", action: "watch", details: "Watched Eternal Love Ep 1", page: "/watch/s1e1", timestamp: "2025-12-10 14:30", ip: "192.168.1.1", device: "Android - Chrome" },
  { id: "a2", userId: "u2", userName: "Jane Smith", userPhone: "+256700333444", action: "click", details: "Clicked Subscribe button", page: "/", timestamp: "2025-12-10 15:00", ip: "192.168.1.2", device: "iPhone - Safari" },
  { id: "a3", userId: "u1", userName: "John Doe", userPhone: "+256700111222", action: "navigate", details: "Navigated to Movies page", page: "/movies", timestamp: "2025-12-10 15:15", ip: "192.168.1.1", device: "Android - Chrome" },
  { id: "a4", userId: "u3", userName: "Peter Kasule", userPhone: "+256700555666", action: "download", details: "Downloaded iQIYI App", page: "/", timestamp: "2025-12-10 16:00", ip: "10.0.0.5", device: "Windows - Firefox" },
  { id: "a5", userId: "u2", userName: "Jane Smith", userPhone: "+256700333444", action: "watch", details: "Watched Detective Mystery", page: "/watch/m2", timestamp: "2025-12-10 17:30", ip: "192.168.1.2", device: "iPhone - Safari" },
];

export const mockAgents: AgentItem[] = [
  { id: "ag1", name: "David Mukasa", phone: "+256700111222", agentId: "AG-X8K2-001", balance: 125000, sharedMovies: 45, sharedSeries: 12, totalEarnings: 350000, status: "active", plan: "Monthly", planExpiry: "2026-03-15", createdAt: "2025-06-01" },
  { id: "ag2", name: "Sarah Nankya", phone: "+256700333444", agentId: "AG-M3P1-002", balance: 50000, sharedMovies: 20, sharedSeries: 5, totalEarnings: 150000, status: "active", plan: "Weekly", planExpiry: "2026-02-25", createdAt: "2025-08-15" },
  { id: "ag3", name: "Moses Opio", phone: "+256700555666", agentId: "AG-R7N4-003", balance: 0, sharedMovies: 0, sharedSeries: 0, totalEarnings: 75000, status: "blocked", plan: "Weekly", planExpiry: "2026-01-10", createdAt: "2025-09-01" },
  { id: "ag4", name: "Grace Atim", phone: "+256700777888", agentId: "AG-K5L9-004", balance: 30000, sharedMovies: 10, sharedSeries: 3, totalEarnings: 80000, status: "expired", plan: "Monthly", planExpiry: "2026-01-20", createdAt: "2025-07-20" },
];

export const mockUsers: UserItem[] = [
  { id: "u1", name: "John Doe", phone: "+256700111222", email: "john@example.com", status: "active", subscription: "VIP Monthly", subscriptionExpiry: "2026-03-01", lastActive: "2025-12-10", createdAt: "2025-01-15" },
  { id: "u2", name: "Jane Smith", phone: "+256700333444", email: "jane@example.com", status: "active", subscription: "Basic Weekly", subscriptionExpiry: "2026-02-20", lastActive: "2025-12-10", createdAt: "2025-03-20" },
  { id: "u3", name: "Peter Kasule", phone: "+256700555666", email: "peter@example.com", status: "inactive", subscription: null, subscriptionExpiry: null, lastActive: "2025-11-01", createdAt: "2025-05-10" },
  { id: "u4", name: "Mary Auma", phone: "+256700777888", email: "mary@example.com", status: "blocked", subscription: "VIP Monthly", subscriptionExpiry: "2026-02-28", lastActive: "2025-12-05", createdAt: "2025-02-01" },
  { id: "u5", name: "Robert Okello", phone: "+256700999000", email: "robert@example.com", status: "active", subscription: "Basic Monthly", subscriptionExpiry: "2026-03-10", lastActive: "2025-12-09", createdAt: "2025-04-12" },
];

export const mockTransactions: WalletTransaction[] = [
  { id: "t1", userId: "u1", userName: "John Doe", userPhone: "+256700111222", type: "subscription", amount: 50000, status: "completed", method: "MTN Mobile Money", createdAt: "2025-12-01" },
  { id: "t2", userId: "u2", userName: "Jane Smith", userPhone: "+256700333444", type: "subscription", amount: 25000, status: "completed", method: "Airtel Money", createdAt: "2025-12-02" },
  { id: "t3", userId: "ag1", userName: "David Mukasa", userPhone: "+256700111222", type: "withdrawal", amount: 100000, status: "completed", method: "MTN Mobile Money", createdAt: "2025-12-05" },
  { id: "t4", userId: "u3", userName: "Peter Kasule", userPhone: "+256700555666", type: "subscription", amount: 25000, status: "failed", method: "MTN Mobile Money", createdAt: "2025-12-06" },
  { id: "t5", userId: "ag2", userName: "Sarah Nankya", userPhone: "+256700333444", type: "agent-share", amount: 5000, status: "completed", method: "Agent Share", createdAt: "2025-12-08" },
  { id: "t6", userId: "u5", userName: "Robert Okello", userPhone: "+256700999000", type: "deposit", amount: 30000, status: "pending", method: "MTN Mobile Money", createdAt: "2025-12-10" },
];

export const adminPlans = [
  // User plans
  { id: "p1", name: "1 Day",   price: 2500,  duration: "1 Day",   days: 1,  type: "user" },
  { id: "p2", name: "3 Days",  price: 5000,  duration: "3 Days",  days: 3,  type: "user" },
  { id: "p3", name: "1 Week",  price: 10000, duration: "1 Week",  days: 7,  type: "user" },
  { id: "p4", name: "1 Month", price: 25000, duration: "1 Month", days: 30, type: "user" },
  // Agent plans
  { id: "p5", name: "Agent 1 Day",   price: 5000,  duration: "1 Day",   days: 1,  type: "agent" },
  { id: "p6", name: "Agent 1 Week",  price: 20000, duration: "1 Week",  days: 7,  type: "agent" },
  { id: "p7", name: "Agent 1 Month", price: 50000, duration: "1 Month", days: 30, type: "agent" },
];
