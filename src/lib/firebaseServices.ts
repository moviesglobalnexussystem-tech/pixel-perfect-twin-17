import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, setDoc, Timestamp,
  type DocumentData, type QueryConstraint
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  SeriesItem, MovieItem, EpisodeItem, CarouselItem,
  TVChannelItem, AgentItem, UserItem, WalletTransaction, UserActivity,
  LatestUpdateItem, CommentItem, WatchLaterItem
} from "@/data/adminData";

// ==================== GENERIC HELPERS ====================
const getCollection = async <T extends { id: string }>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
};

const addItem = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: new Date().toISOString().split("T")[0]
  });
  return docRef.id;
};

const updateItem = async (
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> => {
  const { id: _id, ...rest } = data as any;
  await updateDoc(doc(db, collectionName, id), rest);
};

const deleteItem = async (collectionName: string, id: string): Promise<void> => {
  await deleteDoc(doc(db, collectionName, id));
};

// ==================== SERIES ====================
export const getSeries = () => getCollection<SeriesItem>("series");
export const addSeries = (data: Omit<SeriesItem, "id">) => addItem("series", data);
export const updateSeries = (id: string, data: Partial<SeriesItem>) => updateItem("series", id, data);
export const deleteSeries = (id: string) => deleteItem("series", id);

export const subscribeSeries = (callback: (items: SeriesItem[]) => void) => {
  return onSnapshot(collection(db, "series"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SeriesItem)));
  });
};

// ==================== MOVIES ====================
export const getMovies = () => getCollection<MovieItem>("movies");
export const addMovie = (data: Omit<MovieItem, "id">) => addItem("movies", data);
export const updateMovie = (id: string, data: Partial<MovieItem>) => updateItem("movies", id, data);
export const deleteMovie = (id: string) => deleteItem("movies", id);

export const subscribeMovies = (callback: (items: MovieItem[]) => void) => {
  return onSnapshot(collection(db, "movies"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MovieItem)));
  });
};

// ==================== EPISODES ====================
export const getEpisodes = () => getCollection<EpisodeItem>("episodes");
export const getEpisodesBySeries = async (seriesId: string): Promise<EpisodeItem[]> => {
  const items = await getCollection<EpisodeItem>("episodes", where("seriesId", "==", seriesId));
  return items.sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
};
export const addEpisode = (data: Omit<EpisodeItem, "id">) => addItem("episodes", data);
export const updateEpisode = (id: string, data: Partial<EpisodeItem>) => updateItem("episodes", id, data);
export const deleteEpisode = (id: string) => deleteItem("episodes", id);

export const subscribeEpisodes = (callback: (items: EpisodeItem[]) => void) => {
  return onSnapshot(collection(db, "episodes"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as EpisodeItem)));
  });
};

// ==================== CAROUSELS ====================
export const getCarousels = () => getCollection<CarouselItem>("carousels");
export const getActiveCarousels = () =>
  getCollection<CarouselItem>("carousels", where("isActive", "==", true));
export const addCarousel = (data: Omit<CarouselItem, "id">) => addItem("carousels", data);
export const updateCarousel = (id: string, data: Partial<CarouselItem>) => updateItem("carousels", id, data);
export const deleteCarousel = (id: string) => deleteItem("carousels", id);

export const subscribeCarousels = (callback: (items: CarouselItem[]) => void) => {
  return onSnapshot(collection(db, "carousels"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CarouselItem)));
  });
};

// ==================== TV CHANNELS ====================
export const getTVChannels = () => getCollection<TVChannelItem>("tvChannels");
export const addTVChannel = (data: Omit<TVChannelItem, "id">) => addItem("tvChannels", data);
export const updateTVChannel = (id: string, data: Partial<TVChannelItem>) => updateItem("tvChannels", id, data);
export const deleteTVChannel = (id: string) => deleteItem("tvChannels", id);

export const subscribeTVChannels = (callback: (items: TVChannelItem[]) => void) => {
  return onSnapshot(collection(db, "tvChannels"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TVChannelItem)));
  });
};

// ==================== AGENTS ====================
export const getAgents = () => getCollection<AgentItem>("agents");
export const getAgentByAgentId = async (agentId: string): Promise<AgentItem | null> => {
  const items = await getCollection<AgentItem>("agents", where("agentId", "==", agentId));
  return items[0] || null;
};
export const getAgentByPhone = async (phone: string): Promise<AgentItem | null> => {
  const items = await getCollection<AgentItem>("agents", where("phone", "==", phone));
  return items[0] || null;
};
export const addAgent = (data: Omit<AgentItem, "id">) => addItem("agents", data);
export const updateAgent = (id: string, data: Partial<AgentItem>) => updateItem("agents", id, data);
export const deleteAgent = (id: string) => deleteItem("agents", id);

export const subscribeAgents = (callback: (items: AgentItem[]) => void) => {
  return onSnapshot(collection(db, "agents"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AgentItem)));
  });
};

// ==================== USERS ====================
export const getUsers = () => getCollection<UserItem>("users");
export const getUserByPhone = async (phone: string): Promise<UserItem | null> => {
  const items = await getCollection<UserItem>("users", where("phone", "==", phone));
  return items[0] || null;
};
export const addUser = (data: Omit<UserItem, "id">) => addItem("users", data);
export const updateUser = (id: string, data: Partial<UserItem>) => updateItem("users", id, data);
export const deleteUser = (id: string) => deleteItem("users", id);

export const subscribeUsers = (callback: (items: UserItem[]) => void) => {
  return onSnapshot(collection(db, "users"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserItem)));
  });
};

// ==================== TRANSACTIONS ====================
export const getTransactions = () => getCollection<WalletTransaction>("transactions");
export const addTransaction = (data: Omit<WalletTransaction, "id">) => addItem("transactions", data);
export const deleteTransaction = (id: string) => deleteItem("transactions", id);

export const subscribeTransactions = (callback: (items: WalletTransaction[]) => void) => {
  return onSnapshot(collection(db, "transactions"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WalletTransaction)));
  });
};

// ==================== USER ACTIVITY ====================
export const getActivities = () => getCollection<UserActivity>("activities");
export const addActivity = (data: Omit<UserActivity, "id">) => addItem("activities", data);

export const subscribeActivities = (callback: (items: UserActivity[]) => void) => {
  return onSnapshot(collection(db, "activities"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserActivity)));
  });
};

// ==================== SHARED LINKS (Agent sharing) ====================
export interface SharedLink {
  id: string;
  agentId: string;
  agentDocId: string;
  contentType: "movie" | "series" | "episode";
  contentId: string;
  contentTitle: string;
  price: number;
  views: number;
  earnings: number;
  shareCode: string;
  active: boolean;
  streamLink?: string;
  posterUrl?: string;
  createdAt: string;
}

export const getSharedLinks = () => getCollection<SharedLink>("sharedLinks");
export const getSharedLinksByAgent = (agentDocId: string) =>
  getCollection<SharedLink>("sharedLinks", where("agentDocId", "==", agentDocId));
export const getSharedLinkByCode = async (shareCode: string): Promise<SharedLink | null> => {
  const items = await getCollection<SharedLink>("sharedLinks", where("shareCode", "==", shareCode));
  return items[0] || null;
};
export const addSharedLink = (data: Omit<SharedLink, "id">) => addItem("sharedLinks", data);
export const updateSharedLink = (id: string, data: Partial<SharedLink>) => updateItem("sharedLinks", id, data);

export const subscribeSharedLinks = (agentDocId: string, callback: (items: SharedLink[]) => void) => {
  const q = query(collection(db, "sharedLinks"), where("agentDocId", "==", agentDocId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SharedLink)));
  });
};

// ==================== GENERATE AGENT ID ====================
export const generateAgentId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `AG-${part1}-${part2}`;
};

// ==================== LATEST UPDATES ====================
export const getLatestUpdates = () => getCollection<LatestUpdateItem>("latestUpdates");
export const addLatestUpdate = (data: Omit<LatestUpdateItem, "id">) => addItem("latestUpdates", data);
export const updateLatestUpdate = (id: string, data: Partial<LatestUpdateItem>) => updateItem("latestUpdates", id, data);
export const deleteLatestUpdate = (id: string) => deleteItem("latestUpdates", id);

export const subscribeLatestUpdates = (callback: (items: LatestUpdateItem[]) => void) => {
  return onSnapshot(collection(db, "latestUpdates"), (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LatestUpdateItem)));
  });
};

// ==================== COMMENTS ====================
export const getCommentsByContent = (contentId: string) =>
  getCollection<CommentItem>("comments", where("contentId", "==", contentId), orderBy("createdAt", "desc"));
export const addComment = (data: Omit<CommentItem, "id">) => addItem("comments", data);
export const deleteComment = (id: string) => deleteItem("comments", id);

export const subscribeComments = (contentId: string, callback: (items: CommentItem[]) => void) => {
  const q = query(collection(db, "comments"), where("contentId", "==", contentId));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CommentItem));
    callback(items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
};

// ==================== WATCH LATER ====================
export const getWatchLaterByUser = (userId: string) =>
  getCollection<WatchLaterItem>("watchLater", where("userId", "==", userId));
export const addWatchLater = (data: Omit<WatchLaterItem, "id">) => addItem("watchLater", data);
export const deleteWatchLater = (id: string) => deleteItem("watchLater", id);

export const subscribeWatchLater = (userId: string, callback: (items: WatchLaterItem[]) => void) => {
  const q = query(collection(db, "watchLater"), where("userId", "==", userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WatchLaterItem)));
  });
};
