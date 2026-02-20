import drama1 from "@/assets/drama-1.jpg";
import drama2 from "@/assets/drama-2.jpg";
import drama3 from "@/assets/drama-3.jpg";
import drama4 from "@/assets/drama-4.jpg";
import drama5 from "@/assets/drama-5.jpg";
import drama6 from "@/assets/drama-6.jpg";
import drama7 from "@/assets/drama-7.jpg";
import drama8 from "@/assets/drama-8.jpg";

export interface Drama {
  id: number;
  title: string;
  image: string;
  episodes?: string;
  badge?: string;
  rank?: number;
  firebaseId?: string;
  streamLink?: string;
  downloadLink?: string;
  genre?: string;
  rating?: number;
  description?: string;
  actors?: string;
  isVip?: boolean;
  isHotDrama?: boolean;
  isOriginal?: boolean;
  isAgent?: boolean;
  agentMarkedAt?: string | null;
  categories?: string[];
  displayOrder?: number;
}

const images = [drama1, drama2, drama3, drama4, drama5, drama6, drama7, drama8];

const titles = [
  "Eternal Love of the Fox",
  "Dating with You",
  "The Best Thing",
  "Ultimate Note",
  "Fated Hearts",
  "The Golden Empress",
  "Detective Mystery",
  "Moonlight Fantasy",
];

const episodes = ["38 Episodes", "30 Episodes", "24 Episodes", "40 Episodes", "36 Episodes", "28 Episodes", "32 Episodes", "26 Episodes"];

export const popularDramas: Drama[] = titles.map((title, i) => ({
  id: i + 1,
  title,
  image: images[i],
  episodes: episodes[i],
}));

export const comingSoonDramas: Drama[] = [
  { id: 101, title: "Our Shining Days", image: images[4], badge: "Coming soon" },
  { id: 102, title: "Pursuit of Justice", image: images[3], badge: "Coming soon" },
  { id: 103, title: "When I Meet You", image: images[1], badge: "Coming soon" },
  { id: 104, title: "War of Hearts", image: images[6], badge: "Coming soon" },
  { id: 105, title: "The Legend of Many Clouds", image: images[2], badge: "Coming soon" },
  { id: 106, title: "Fate Chases You", image: images[7], badge: "Coming soon" },
  { id: 107, title: "Sword of Destiny", image: images[0], badge: "Coming soon" },
  { id: 108, title: "Palace Intrigue", image: images[5], badge: "Coming soon" },
];

export const dramaSelection: Drama[] = titles.map((title, i) => ({
  id: i + 200,
  title,
  image: images[i],
  episodes: episodes[i],
  rank: i + 1,
}));

export const highQualityDramas: Drama[] = [
  { id: 301, title: "In the Wonder", image: images[7], episodes: "32 Episodes" },
  { id: 302, title: "Lost in the Shadows", image: images[6], episodes: "28 Episodes" },
  { id: 303, title: "In the Name of the Brother", image: images[3], episodes: "40 Episodes" },
  { id: 304, title: "War of Faith", image: images[4], episodes: "36 Episodes" },
  { id: 305, title: "City of the City", image: images[1], episodes: "24 Episodes" },
  { id: 306, title: "Rising to the Stars", image: images[0], episodes: "30 Episodes" },
  { id: 307, title: "Imperfect Victim", image: images[5], episodes: "26 Episodes" },
  { id: 308, title: "Detective Chronicles", image: images[2], episodes: "38 Episodes" },
];

export const sweetRomanceDramas: Drama[] = [
  { id: 401, title: "How Dare You?", image: images[4], episodes: "New Episode" },
  { id: 402, title: "Sweet and Loves", image: images[1], episodes: "30 Episodes" },
  { id: 403, title: "Dating with You", image: images[5], episodes: "Updated" },
  { id: 404, title: "Fated Hearts", image: images[0], episodes: "36 Episodes" },
  { id: 405, title: "The Best Thing", image: images[2], episodes: "24 Episodes" },
  { id: 406, title: "Peach Lover", image: images[7], episodes: "28 Episodes" },
  { id: 407, title: "Infinite Cycles of Love", image: images[3], episodes: "32 Episodes" },
  { id: 408, title: "The Unfinished Red", image: images[6], episodes: "40 Episodes" },
];

export const ancientCostumeDramas: Drama[] = [
  { id: 501, title: "Infinite Cycles of Love", image: images[0], episodes: "38 Episodes" },
  { id: 502, title: "The Unfinished Red", image: images[2], episodes: "30 Episodes" },
  { id: 503, title: "Moonlight Mystique", image: images[7], episodes: "24 Episodes" },
  { id: 504, title: "Wing of Burning Palace", image: images[5], episodes: "40 Episodes" },
  { id: 505, title: "Coroner's Diary", image: images[6], episodes: "36 Episodes" },
  { id: 506, title: "My Journey to You", image: images[3], episodes: "28 Episodes" },
  { id: 507, title: "New Life Begins", image: images[1], episodes: "32 Episodes" },
  { id: 508, title: "Sharp Blade in the Snow", image: images[4], episodes: "26 Episodes" },
];

export const genreTags = [
  "All Videos", "China Mainland", "South Korea", "Thailand", "Korean", "Japan",
  "Malaysia", "Anime", "Life", "Youth", "Mystery", "LGBT", "Romance",
  "Best Love", "Marriage"
];
