import cast1 from "@/assets/cast-1.jpg";
import cast3 from "@/assets/cast-3.jpg";
import episodeThumb1 from "@/assets/episode-thumb-1.jpg";
import episodeThumb2 from "@/assets/episode-thumb-2.jpg";

export interface CastMember {
  name: string;
  role: string;
  image: string;
}

export interface Episode {
  number: number;
  title: string;
  thumbnail: string;
  duration: string;
}

export const castMembers: CastMember[] = [
  { name: "Liu Hai Bo", role: "Director", image: cast1 },
  { name: "Wang Li", role: "Director", image: cast3 },
  { name: "Wang Chu Ran", role: "Cast", image: cast1 },
  { name: "Ryan Lei Cheng", role: "Cast", image: cast3 },
  { name: "Daddi Tang", role: "Cast", image: cast1 },
  { name: "Hu Yixuan", role: "Cast", image: cast3 },
  { name: "Ma Su", role: "Cast", image: cast1 },
];

export const episodes: Episode[] = [
  { number: 27, title: "EP27 Xiahou Bo Imprisons Xiahou Dan", thumbnail: episodeThumb1, duration: "45:38" },
  { number: 27, title: "EP27 Xiahou Dan's Letter to His Wife", thumbnail: episodeThumb2, duration: "03:33" },
  { number: 26, title: "EP26 Xiahou Dan and Xiahou Bo officially begin their war", thumbnail: episodeThumb1, duration: "02:39" },
  { number: 26, title: "EP26 Xie Yongjie is killed while protecting Yu Wanyin", thumbnail: episodeThumb2, duration: "04:12" },
  { number: 25, title: "EP25 Xiahou Dan was poisoned from a young age", thumbnail: episodeThumb1, duration: "03:55" },
  { number: 25, title: "EP25 Yu Wanyin plans to send Xie Yongjie out of the palace", thumbnail: episodeThumb2, duration: "05:01" },
];

export const tags = ["Chinese Mainland", "Romance", "Comedy", "Arrogant Superior", "Costume", "Mandarin", "Novel Adaptation"];

export const top10Dramas = [
  "How Dare You?",
  "SPEED AND LOVE",
  "Peach Lover",
  "Duang with You (UNCUT)",
  "Fated Hearts",
  "The Best Thing",
  "The Unclouded Soul",
  "Infinite Cycle of Love",
  "Khemjira",
  "Story of Kunning Palace",
];
