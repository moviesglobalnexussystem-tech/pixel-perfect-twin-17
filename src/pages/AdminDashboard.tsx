import { useState, useEffect } from "react";
import {
  LayoutDashboard, Film, Tv, PlayCircle, Image, Radio, Activity,
  Users, ShieldCheck, Wallet, ChevronLeft, ChevronRight, Plus, Pencil,
  Trash2, Ban, CheckCircle, Eye, Search, Download, X, Star, Clock,
  ArrowUpDown, AlertTriangle, RefreshCw, Newspaper, ListOrdered, Trophy,
  Loader2, ArrowDownToLine, Lock
} from "lucide-react";
import SelectionManager from "@/components/admin/SelectionManager";
import RankManager from "@/components/admin/RankManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  type SeriesItem, type MovieItem, type EpisodeItem, type CarouselItem,
  type TVChannelItem, type AgentItem, type UserItem, type WalletTransaction,
  type UserActivity, type LatestUpdateItem, adminPlans
} from "@/data/adminData";
import {
  subscribeSeries, subscribeMovies, subscribeEpisodes, subscribeCarousels,
  subscribeTVChannels, subscribeAgents, subscribeUsers, subscribeTransactions,
  subscribeActivities, subscribeLatestUpdates,
  addSeries, updateSeries, deleteSeries,
  addMovie, updateMovie, deleteMovie,
  addEpisode, updateEpisode, deleteEpisode,
  addCarousel, updateCarousel, deleteCarousel,
  addTVChannel, updateTVChannel, deleteTVChannel,
  addLatestUpdate, updateLatestUpdate, deleteLatestUpdate,
  updateAgent, deleteAgent,
  updateUser, deleteUser,
  deleteTransaction, addTransaction,
} from "@/lib/firebaseServices";
import { getWalletBalance, getLivraTransactions, requestWithdraw } from "@/lib/livraPayment";

const ADMIN_EMAIL = "mainplatform.nexus@gmail.com";

type Section = "overview" | "series" | "movies" | "episodes" | "carousel" | "tv-channels" | "latest-updates" | "activity" | "agents" | "users" | "wallet" | "selection" | "ranking";

const sidebarItems: { key: Section; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "series", label: "Series", icon: Tv },
  { key: "movies", label: "Movies", icon: Film },
  { key: "episodes", label: "Episodes", icon: PlayCircle },
  { key: "selection", label: "Selection", icon: ListOrdered },
  { key: "ranking", label: "Ranking", icon: Trophy },
  { key: "carousel", label: "Carousel", icon: Image },
  { key: "tv-channels", label: "TV Channels", icon: Radio },
  { key: "latest-updates", label: "Latest Updates", icon: Newspaper },
  { key: "activity", label: "User Activity", icon: Activity },
  { key: "agents", label: "Agents", icon: ShieldCheck },
  { key: "users", label: "Users", icon: Users },
  { key: "wallet", label: "Wallet", icon: Wallet },
];

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  // Admin access check
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Real-time data from Firestore
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [tvChannels, setTvChannels] = useState<TVChannelItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<LatestUpdateItem[]>([]);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    if (!isAdmin) return;
    const unsubs = [
      subscribeSeries(setSeries),
      subscribeMovies(setMovies),
      subscribeEpisodes(setEpisodes),
      subscribeCarousels(setCarousels),
      subscribeTVChannels(setTvChannels),
      subscribeAgents(setAgents),
      subscribeUsers(setUsers),
      subscribeTransactions(setTransactions),
      subscribeActivities(setActivities),
      subscribeLatestUpdates(setLatestUpdates),
    ];
    return () => unsubs.forEach(u => u());
  }, [isAdmin]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Block non-admin users
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-sm shadow-xl">
          <Lock className="w-14 h-14 text-destructive mx-auto mb-4" />
          <h1 className="text-foreground text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            This page is restricted to authorized administrators only.
          </p>
          <Button onClick={() => navigate("/")} className="text-xs">Go Home</Button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Movies", value: movies.length, color: "text-primary" },
    { label: "Total Series", value: series.length, color: "text-primary" },
    { label: "Total Episodes", value: episodes.length, color: "text-primary" },
    { label: "Total Users", value: users.length, color: "text-blue-400" },
    { label: "Total Agents", value: agents.length, color: "text-accent" },
    { label: "User Activities", value: activities.length, color: "text-purple-400" },
    { label: "Total Carousel", value: carousels.length, color: "text-pink-400" },
    { label: "TV Channels", value: tvChannels.length, color: "text-cyan-400" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`${collapsed ? "w-16" : "w-56"} bg-card border-r border-border flex flex-col transition-all duration-200 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]`}>
        <div className="flex items-center justify-between p-3 border-b border-border">
          {!collapsed && <span className="text-xs font-bold text-primary uppercase tracking-wider">Admin Panel</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground hover:text-foreground p-1">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => setSection(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  section === item.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-foreground">{sidebarItems.find(i => i.key === section)?.label}</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-48 bg-secondary border-border" />
            </div>
          </div>
        </div>

        {section === "overview" && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {stats.map(s => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activities</h3>
                <div className="space-y-2">
                  {activities.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-xs border-b border-border pb-2">
                      <div>
                        <span className="text-foreground font-medium">{a.userName}</span>
                        <span className="text-muted-foreground ml-2">{a.details}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{a.action}</Badge>
                    </div>
                  ))}
                  {activities.length === 0 && <p className="text-muted-foreground text-xs">No activities yet</p>}
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between text-xs border-b border-border pb-2">
                      <div>
                        <span className="text-foreground font-medium">{t.userName}</span>
                        <span className="text-muted-foreground ml-2">{t.type}</span>
                      </div>
                      <span className={`font-bold ${t.status === "completed" ? "text-primary" : t.status === "failed" ? "text-destructive" : "text-accent"}`}>
                        {t.amount.toLocaleString()} UGX
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-muted-foreground text-xs">No transactions yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "series" && <SeriesSection series={series} search={search} />}
        {section === "movies" && <MoviesSection movies={movies} search={search} />}
        {section === "episodes" && <EpisodesSection episodes={episodes} series={series} search={search} />}
        {section === "selection" && <SelectionManager series={series} movies={movies} />}
        {section === "ranking" && <RankManager series={series} movies={movies} />}
        {section === "carousel" && <CarouselSection carousels={carousels} series={series} movies={movies} episodes={episodes} tvChannels={tvChannels} latestUpdates={latestUpdates} search={search} />}
        {section === "tv-channels" && <TVChannelSection channels={tvChannels} search={search} />}
        {section === "latest-updates" && <LatestUpdatesSection updates={latestUpdates} search={search} />}
        {section === "activity" && <ActivitySection activities={activities} search={search} />}
        {section === "agents" && <AgentSection agents={agents} search={search} />}
        {section === "users" && <UsersSection users={users} search={search} />}
        {section === "wallet" && <WalletSection transactions={transactions} search={search} />}
      </main>
    </div>
  );
};

// ==================== SERIES SECTION ====================
const SeriesSection = ({ series, search }: { series: SeriesItem[]; search: string }) => {
  const filtered = series.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const [form, setForm] = useState<Partial<SeriesItem>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SeriesItem | null>(null);
  const { toast } = useToast();

  const openNew = () => { setForm({}); setEditing(null); setShowForm(true); };
  const openEdit = (s: SeriesItem) => { setForm({ ...s }); setEditing(s); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateSeries(editing.id, form);
        toast({ title: "Series updated" });
      } else {
        await addSeries(form as any);
        toast({ title: "Series added" });
      }
      setShowForm(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSeries(id);
      toast({ title: "Series deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (showForm) return (
    <ContentForm title={editing ? "Edit Series" : "Add New Series"} onClose={() => setShowForm(false)} onSave={handleSave}>
      <FormField label="Series Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
      <FormField label="Poster URL" value={form.posterUrl || ""} onChange={v => setForm({ ...form, posterUrl: v })} />
      <FormField label="Description" value={form.description || ""} onChange={v => setForm({ ...form, description: v })} multiline />
      <FormField label="Genre (comma separated)" value={form.genre || ""} onChange={v => setForm({ ...form, genre: v })} />
      <FormField label="Actors (comma separated)" value={form.actors || ""} onChange={v => setForm({ ...form, actors: v })} />
      <FormField label="Total Episodes" value={String(form.totalEpisodes || "")} onChange={v => setForm({ ...form, totalEpisodes: parseInt(v) || 0 })} />
      <FormField label="Rating (0-10)" value={String(form.rating || "")} onChange={v => setForm({ ...form, rating: parseFloat(v) || 0 })} />
      <FormField label="Display Order (lower = first)" value={String(form.displayOrder || 0)} onChange={v => setForm({ ...form, displayOrder: parseInt(v) || 0 })} />
      <div className="mb-2">
        <p className="text-xs font-medium text-foreground mb-2">Display Sections (check all that apply)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <CheckboxField label="Popular" checked={!!form.isPopular} onChange={v => setForm({ ...form, isPopular: v })} />
          <CheckboxField label="Coming Soon" checked={!!form.isComingSoon} onChange={v => setForm({ ...form, isComingSoon: v })} />
          <CheckboxField label="Top Ten / Drama Selection" checked={!!form.isTopTen} onChange={v => setForm({ ...form, isTopTen: v })} />
          <CheckboxField label="Hot Drama" checked={!!form.isHotDrama} onChange={v => setForm({ ...form, isHotDrama: v })} />
          <CheckboxField label="Original" checked={!!form.isOriginal} onChange={v => setForm({ ...form, isOriginal: v })} />
          <CheckboxField label="VIP" checked={!!form.isVip} onChange={v => setForm({ ...form, isVip: v })} />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Category Sections</p>
        <MultiSelect
          label="Categories"
          options={["Sweet Romance", "Ancient Costume", "High Quality Dramas", "Drama Selection", "Hot Drama"]}
          selected={form.categories || []}
          onChange={v => setForm({ ...form, categories: v })}
        />
      </div>
    </ContentForm>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} series</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Add Series</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Genre</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Episodes</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Rating</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Tags</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{s.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{s.genre}</td>
                <td className="p-3 text-center">{s.totalEpisodes}</td>
                <td className="p-3 text-center hidden sm:table-cell"><span className="text-accent">{s.rating}</span></td>
                <td className="p-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {s.isPopular && <Badge className="text-[9px] bg-primary/20 text-primary border-0">Popular</Badge>}
                    {s.isTopTen && <Badge className="text-[9px] bg-accent/20 text-accent border-0">Top 10</Badge>}
                    {s.isVip && <Badge className="text-[9px] bg-purple-500/20 text-purple-400 border-0">VIP</Badge>}
                    {s.isHotDrama && <Badge className="text-[9px] bg-destructive/20 text-destructive border-0">Hot</Badge>}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">No series yet. Click "Add Series" to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== MOVIES SECTION ====================
const MoviesSection = ({ movies, search }: { movies: MovieItem[]; search: string }) => {
  const filtered = movies.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  const [form, setForm] = useState<Partial<MovieItem>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MovieItem | null>(null);
  const { toast } = useToast();

  const openNew = () => { setForm({}); setEditing(null); setShowForm(true); };
  const openEdit = (m: MovieItem) => { setForm({ ...m }); setEditing(m); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMovie(editing.id, form);
        toast({ title: "Movie updated" });
      } else {
        await addMovie(form as any);
        toast({ title: "Movie added" });
      }
      setShowForm(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteMovie(id); toast({ title: "Movie deleted" }); } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  if (showForm) return (
    <ContentForm title={editing ? "Edit Movie" : "Add New Movie"} onClose={() => setShowForm(false)} onSave={handleSave}>
      <FormField label="Movie Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
      <FormField label="Poster URL" value={form.posterUrl || ""} onChange={v => setForm({ ...form, posterUrl: v })} />
      <FormField label="Stream Link (Video URL / .m3u8)" value={form.streamLink || ""} onChange={v => setForm({ ...form, streamLink: v })} />
      <FormField label="Download Link (optional)" value={form.downloadLink || ""} onChange={v => setForm({ ...form, downloadLink: v })} />
      <FormField label="Description" value={form.description || ""} onChange={v => setForm({ ...form, description: v })} multiline />
      <FormField label="Genre (comma separated)" value={form.genre || ""} onChange={v => setForm({ ...form, genre: v })} />
      <FormField label="Actors (comma separated)" value={form.actors || ""} onChange={v => setForm({ ...form, actors: v })} />
      <FormField label="Rating (0-10)" value={String(form.rating || "")} onChange={v => setForm({ ...form, rating: parseFloat(v) || 0 })} />
      <FormField label="Display Order (lower = first)" value={String(form.displayOrder || 0)} onChange={v => setForm({ ...form, displayOrder: parseInt(v) || 0 })} />
      <div className="mb-2">
        <p className="text-xs font-medium text-foreground mb-2">Display Sections (check all that apply)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <CheckboxField label="Popular" checked={!!form.isPopular} onChange={v => setForm({ ...form, isPopular: v })} />
          <CheckboxField label="Coming Soon" checked={!!form.isComingSoon} onChange={v => setForm({ ...form, isComingSoon: v })} />
          <CheckboxField label="Top Ten / Drama Selection" checked={!!form.isTopTen} onChange={v => setForm({ ...form, isTopTen: v })} />
          <CheckboxField label="Hot Drama" checked={!!form.isHotDrama} onChange={v => setForm({ ...form, isHotDrama: v })} />
          <CheckboxField label="Original" checked={!!form.isOriginal} onChange={v => setForm({ ...form, isOriginal: v })} />
          <CheckboxField label="VIP" checked={!!form.isVip} onChange={v => setForm({ ...form, isVip: v })} />
          <CheckboxField label="🔥 Agent Exclusive (5 days)" checked={!!form.isAgent} onChange={v => setForm({ ...form, isAgent: v, agentMarkedAt: v ? new Date().toISOString() : null })} />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Category Sections</p>
        <MultiSelect
          label="Categories"
          options={["Sweet Romance", "Ancient Costume", "High Quality Dramas", "Drama Selection", "Hot Drama"]}
          selected={form.categories || []}
          onChange={v => setForm({ ...form, categories: v })}
        />
      </div>
    </ContentForm>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} movies</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Add Movie</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Genre</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Rating</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Tags</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Stream</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{m.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{m.genre}</td>
                <td className="p-3 text-center hidden sm:table-cell"><span className="text-accent">{m.rating}</span></td>
                <td className="p-3 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {m.isPopular && <Badge className="text-[9px] bg-primary/20 text-primary border-0">Popular</Badge>}
                    {m.isVip && <Badge className="text-[9px] bg-purple-500/20 text-purple-400 border-0">VIP</Badge>}
                  </div>
                </td>
                <td className="p-3 text-center hidden sm:table-cell">
                  {m.streamLink ? <CheckCircle className="w-3.5 h-3.5 text-primary mx-auto" /> : <X className="w-3.5 h-3.5 text-muted-foreground mx-auto" />}
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">No movies yet. Click "Add Movie" to get started.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== EPISODES SECTION ====================
const EpisodesSection = ({ episodes, series, search }: { episodes: EpisodeItem[]; series: SeriesItem[]; search: string }) => {
  const filtered = episodes.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.seriesName.toLowerCase().includes(search.toLowerCase()));
  const [form, setForm] = useState<Partial<EpisodeItem>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EpisodeItem | null>(null);
  const { toast } = useToast();

  const openNew = () => { setForm({}); setEditing(null); setShowForm(true); };
  const openEdit = (e: EpisodeItem) => { setForm({ ...e }); setEditing(e); setShowForm(true); };

  const handleSave = async () => {
    try {
      const selectedSeries = series.find((s) => s.id === form.seriesId);
      const data = { ...form, seriesName: selectedSeries?.name || form.seriesName || "" };
      if (editing) {
        await updateEpisode(editing.id, data);
        toast({ title: "Episode updated" });
      } else {
        await addEpisode(data as any);
        toast({ title: "Episode added" });
      }
      setShowForm(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteEpisode(id); toast({ title: "Episode deleted" }); } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  if (showForm) return (
    <ContentForm title={editing ? "Edit Episode" : "Add New Episode"} onClose={() => setShowForm(false)} onSave={handleSave}>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Series</label>
        <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.seriesId || ""} onChange={e => setForm({ ...form, seriesId: e.target.value })}>
          <option value="">-- Select Series --</option>
          {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <FormField label="Episode Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
      <FormField label="Season Number" value={String(form.seasonNumber || "")} onChange={v => setForm({ ...form, seasonNumber: parseInt(v) || 1 })} />
      <FormField label="Episode Number" value={String(form.episodeNumber || "")} onChange={v => setForm({ ...form, episodeNumber: parseInt(v) || 1 })} />
      <FormField label="Stream Link (Video URL)" value={form.streamLink || ""} onChange={v => setForm({ ...form, streamLink: v })} />
      <FormField label="Download Link (optional)" value={form.downloadLink || ""} onChange={v => setForm({ ...form, downloadLink: v })} />
      <CheckboxField label="🔥 Agent Exclusive (5 days)" checked={!!form.isAgent} onChange={v => setForm({ ...form, isAgent: v, agentMarkedAt: v ? new Date().toISOString() : null })} />
    </ContentForm>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} episodes</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Add Episode</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Series</th>
            <th className="text-left p-3 text-muted-foreground font-medium">Episode Name</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Season</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Episode</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Stream</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 text-primary font-medium">{e.seriesName}</td>
                <td className="p-3 text-foreground">{e.name}</td>
                <td className="p-3 text-center">S{e.seasonNumber}</td>
                <td className="p-3 text-center">E{e.episodeNumber}</td>
                <td className="p-3 text-center hidden sm:table-cell">
                  {e.streamLink ? <CheckCircle className="w-3.5 h-3.5 text-primary mx-auto" /> : <X className="w-3.5 h-3.5 text-muted-foreground mx-auto" />}
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">No episodes yet. Add a series first, then add episodes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== CAROUSEL SECTION ====================
const CarouselSection = ({ carousels, series, movies, episodes, tvChannels, latestUpdates, search }: any) => {
  const filtered = carousels.filter((c: CarouselItem) => c.title.toLowerCase().includes(search.toLowerCase()));
  const [form, setForm] = useState<Partial<CarouselItem>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CarouselItem | null>(null);
  const { toast } = useToast();

  const openNew = () => { setForm({ isActive: true }); setEditing(null); setShowForm(true); };
  const openEdit = (c: CarouselItem) => { setForm({ ...c }); setEditing(c); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editing) { await updateCarousel(editing.id, form); toast({ title: "Carousel updated" }); }
      else { await addCarousel(form as any); toast({ title: "Carousel added" }); }
      setShowForm(false);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteCarousel(id); toast({ title: "Carousel deleted" }); } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  if (showForm) return (
    <ContentForm title={editing ? "Edit Carousel" : "Add Carousel"} onClose={() => setShowForm(false)} onSave={handleSave}>
      <FormField label="Title" value={form.title || ""} onChange={v => setForm({ ...form, title: v })} />
      <FormField label="Subtitle" value={form.subtitle || ""} onChange={v => setForm({ ...form, subtitle: v })} />
      <FormField label="Hot Word" value={form.hotWord || ""} onChange={v => setForm({ ...form, hotWord: v })} placeholder="e.g. HOT, NEW, LIVE" />
      <FormField label="Image URL" value={form.imageUrl || ""} onChange={v => setForm({ ...form, imageUrl: v })} />
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Link Type</label>
        <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.linkType || ""} onChange={e => setForm({ ...form, linkType: e.target.value as any })}>
          <option value="">-- Select Link Type --</option>
          <option value="movie">Movie</option>
          <option value="series">Series</option>
          <option value="episode">Episode</option>
          <option value="live-match">Live Match</option>
          <option value="tv-channel">TV Channel</option>
          <option value="live-sport">Live Sport Page</option>
          <option value="latest-update">Latest Update</option>
          <option value="agent-plan">Agent Subscription Plan</option>
        </select>
      </div>
      {form.linkType === "movie" && (
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Select Movie</label>
          <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.linkId || ""} onChange={e => setForm({ ...form, linkId: e.target.value })}>
            <option value="">-- Select --</option>
            {movies.map((m: MovieItem) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      )}
      {form.linkType === "series" && (
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Select Series</label>
          <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.linkId || ""} onChange={e => setForm({ ...form, linkId: e.target.value })}>
            <option value="">-- Select --</option>
            {series.map((s: SeriesItem) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      {form.linkType === "episode" && (
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Select Episode</label>
          <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.linkId || ""} onChange={e => setForm({ ...form, linkId: e.target.value })}>
            <option value="">-- Select --</option>
            {episodes.map((e: EpisodeItem) => <option key={e.id} value={e.id}>{e.seriesName} - {e.name}</option>)}
          </select>
        </div>
      )}
      {form.linkType === "tv-channel" && (
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Select TV Channel</label>
          <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.linkId || ""} onChange={e => setForm({ ...form, linkId: e.target.value })}>
            <option value="">-- Select --</option>
            {tvChannels.map((t: TVChannelItem) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}
      {form.linkType === "latest-update" && (
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Select Update</label>
          <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.linkId || ""} onChange={e => setForm({ ...form, linkId: e.target.value })}>
            <option value="">-- Select --</option>
            {latestUpdates.map((u: LatestUpdateItem) => <option key={u.id} value={u.id}>{u.title}</option>)}
          </select>
        </div>
      )}
      {form.linkType === "live-match" && <FormField label="Match ID / Link" value={form.linkId || ""} onChange={v => setForm({ ...form, linkId: v })} />}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Display On Page</label>
        <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={form.page || "home"} onChange={e => setForm({ ...form, page: e.target.value as any })}>
          <option value="home">Home Page</option>
          <option value="series">Series Page</option>
          <option value="movies">Movies Page</option>
        </select>
      </div>
      <CheckboxField label="Active" checked={!!form.isActive} onChange={v => setForm({ ...form, isActive: v })} />
    </ContentForm>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} carousel items</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Add Carousel</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Title</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Hot Word</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Link Type</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((c: CarouselItem) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{c.title}<br/><span className="text-muted-foreground text-[10px]">{c.subtitle}</span></td>
                <td className="p-3 hidden md:table-cell"><Badge className="text-[9px] bg-destructive/20 text-destructive border-0">{c.hotWord}</Badge></td>
                <td className="p-3 text-center capitalize">{c.linkType}</td>
                <td className="p-3 text-center">{c.isActive ? <Badge className="text-[9px] bg-primary/20 text-primary border-0">Active</Badge> : <Badge className="text-[9px] bg-muted text-muted-foreground border-0">Inactive</Badge>}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No carousel items yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== TV CHANNEL SECTION ====================
const TVChannelSection = ({ channels, search }: { channels: TVChannelItem[]; search: string }) => {
  const filtered = channels.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const [form, setForm] = useState<Partial<TVChannelItem>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TVChannelItem | null>(null);
  const { toast } = useToast();

  const openNew = () => { setForm({ isLive: true }); setEditing(null); setShowForm(true); };
  const openEdit = (c: TVChannelItem) => { setForm({ ...c }); setEditing(c); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editing) { await updateTVChannel(editing.id, form); toast({ title: "TV Channel updated" }); }
      else { await addTVChannel(form as any); toast({ title: "TV Channel added" }); }
      setShowForm(false);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTVChannel(id); toast({ title: "TV Channel deleted" }); } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  if (showForm) return (
    <ContentForm title={editing ? "Edit TV Channel" : "Add TV Channel"} onClose={() => setShowForm(false)} onSave={handleSave}>
      <FormField label="Channel Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} />
      <FormField label="Logo URL" value={form.logoUrl || ""} onChange={v => setForm({ ...form, logoUrl: v })} />
      <FormField label="Stream Link" value={form.streamLink || ""} onChange={v => setForm({ ...form, streamLink: v })} />
      <FormField label="Category" value={form.category || ""} onChange={v => setForm({ ...form, category: v })} placeholder="e.g. Drama, Sports, News" />
      <FormField label="Description" value={form.description || ""} onChange={v => setForm({ ...form, description: v })} multiline />
      <CheckboxField label="Live Now" checked={!!form.isLive} onChange={v => setForm({ ...form, isLive: v })} />
    </ContentForm>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} channels</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Add Channel</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Category</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Stream</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{c.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{c.category}</td>
                <td className="p-3 text-center">{c.isLive ? <Badge className="text-[9px] bg-destructive/20 text-destructive border-0">LIVE</Badge> : <Badge className="text-[9px] bg-muted text-muted-foreground border-0">Offline</Badge>}</td>
                <td className="p-3 text-center hidden sm:table-cell">{c.streamLink ? <CheckCircle className="w-3.5 h-3.5 text-primary mx-auto" /> : <X className="w-3.5 h-3.5 text-muted-foreground mx-auto" />}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No TV channels yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== ACTIVITY SECTION ====================
const ActivitySection = ({ activities, search }: { activities: UserActivity[]; search: string }) => {
  // Newest first
  const sorted = [...activities].sort((a, b) =>
    new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );
  const filtered = sorted.filter(a => a.userName.toLowerCase().includes(search.toLowerCase()) || a.details.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-border bg-secondary/50">
          <th className="text-left p-3 text-muted-foreground font-medium">User</th>
          <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Phone</th>
          <th className="text-center p-3 text-muted-foreground font-medium">Action</th>
          <th className="text-left p-3 text-muted-foreground font-medium">Details</th>
          <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Page</th>
          <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Time</th>
          <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Device</th>
        </tr></thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
              <td className="p-3 font-medium text-foreground">{a.userName}</td>
              <td className="p-3 text-muted-foreground hidden md:table-cell">{a.userPhone}</td>
              <td className="p-3 text-center"><Badge variant="outline" className="text-[10px] capitalize">{a.action}</Badge></td>
              <td className="p-3 text-muted-foreground">{a.details}</td>
              <td className="p-3 text-muted-foreground hidden lg:table-cell text-[10px]">{a.page}</td>
              <td className="p-3 text-muted-foreground hidden sm:table-cell text-[10px]">{a.timestamp}</td>
              <td className="p-3 text-muted-foreground hidden lg:table-cell text-[10px]">{a.device}</td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">No activities recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

// ==================== AGENT SECTION ====================
const AgentSection = ({ agents, search }: { agents: AgentItem[]; search: string }) => {
  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.agentId.toLowerCase().includes(search.toLowerCase()));
  const [actionModal, setActionModal] = useState<{ type: string; agent: AgentItem } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", plan: "Agent 1 Month" });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAction = (type: string, agent: AgentItem) => setActionModal({ type, agent });

  const confirmAction = async () => {
    if (!actionModal) return;
    const { type, agent } = actionModal;
    try {
      if (type === "block") { await updateAgent(agent.id, { status: "blocked" }); toast({ title: "Agent blocked" }); }
      else if (type === "activate") {
        // Calculate expiry from selected plan
        const planInfo = adminPlans.find(p => p.name === selectedPlan || p.name === agent.plan);
        const expiry = planInfo ? new Date(Date.now() + planInfo.days * 86400000).toISOString().split("T")[0] : agent.planExpiry;
        await updateAgent(agent.id, { status: "active", plan: selectedPlan || agent.plan, planExpiry: expiry });
        toast({ title: "Agent activated" });
      }
      else if (type === "remove") { await deleteAgent(agent.id); toast({ title: "Agent removed" }); }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    setActionModal(null);
    setSelectedPlan("");
  };

  const handleAddAgent = async () => {
    if (!addForm.name || !addForm.phone) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    setIsAdding(true);
    try {
      const { generateAgentId, addAgent } = await import("@/lib/firebaseServices");
      const newAgentId = generateAgentId();
      const planInfo = adminPlans.find(p => p.name === addForm.plan);
      const expiry = planInfo
        ? new Date(Date.now() + (planInfo.days || 30) * 86400000).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      await addAgent({
        name: addForm.name,
        phone: addForm.phone,
        agentId: newAgentId,
        balance: 0,
        sharedMovies: 0,
        sharedSeries: 0,
        totalEarnings: 0,
        status: "active",
        plan: addForm.plan,
        planExpiry: expiry,
        createdAt: new Date().toISOString().split("T")[0],
      } as any);

      toast({ title: "Agent created!", description: `Agent ID: ${newAgentId}` });
      setShowAddAgent(false);
      setAddForm({ name: "", phone: "", plan: "Agent 1 Month" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsAdding(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} agents</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowAddAgent(true)}><Plus className="w-3.5 h-3.5" /> Add Agent</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Phone</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden lg:table-cell">Agent ID</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Balance</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Shares</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Earnings</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden md:table-cell">Plan</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{a.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{a.phone}</td>
                <td className="p-3 text-primary font-mono text-[10px] hidden lg:table-cell">{a.agentId}</td>
                <td className="p-3 text-center font-bold text-accent">{a.balance.toLocaleString()}</td>
                <td className="p-3 text-center hidden sm:table-cell">{a.sharedMovies + a.sharedSeries}</td>
                <td className="p-3 text-center hidden lg:table-cell text-primary">{a.totalEarnings.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <Badge className={`text-[9px] border-0 ${a.status === "active" ? "bg-primary/20 text-primary" : a.status === "blocked" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>{a.status}</Badge>
                </td>
                <td className="p-3 text-center text-muted-foreground hidden md:table-cell">{a.plan}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    {a.status !== "blocked" && <button onClick={() => handleAction("block", a)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Ban className="w-3.5 h-3.5" /></button>}
                    {a.status !== "active" && <button onClick={() => handleAction("activate", a)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><CheckCircle className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => handleAction("remove", a)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground text-xs">No agents yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {actionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-3 capitalize">{actionModal.type} Agent</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {actionModal.type === "block" && `Block ${actionModal.agent.name}?`}
              {actionModal.type === "remove" && `Remove ${actionModal.agent.name}?`}
              {actionModal.type === "activate" && `Activate ${actionModal.agent.name}?`}
            </p>
            {actionModal.type === "activate" && (
              <div className="mb-4">
                <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                  <option value="">-- Keep Current --</option>
                  {adminPlans.filter(p => p.type === "agent" || p.type === "agent-renewal").map(p => (
                    <option key={p.id} value={p.name}>{p.name} - {p.price.toLocaleString()} UGX</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button size="sm" className={`h-8 text-xs ${actionModal.type === "remove" || actionModal.type === "block" ? "bg-destructive hover:bg-destructive/80" : ""}`} onClick={confirmAction}>Confirm</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddAgent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAddAgent(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-4">Add New Agent</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Agent Name *</label>
                <Input value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} placeholder="Full name" className="h-9 text-xs bg-secondary border-border" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Phone Number *</label>
                <Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="07XXXXXXXX" className="h-9 text-xs bg-secondary border-border" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Agent Plan</label>
                <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={addForm.plan} onChange={e => setAddForm({ ...addForm, plan: e.target.value })}>
                  {adminPlans.filter(p => p.type === "agent").map(p => (
                    <option key={p.id} value={p.name}>{p.name} — UGX {p.price.toLocaleString()} / {p.duration}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-muted-foreground">An Agent ID will be auto-generated for this agent.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setShowAddAgent(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleAddAgent} disabled={isAdding || !addForm.name || !addForm.phone}>
                {isAdding ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== USERS SECTION ====================
const UsersSection = ({ users, search }: { users: UserItem[]; search: string }) => {
  const [tab, setTab] = useState<"all" | "active" | "never">("all");
  // Sort newest first
  const sortedUsers = [...users].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  const filtered = sortedUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
    if (tab === "active") return matchSearch && u.subscription !== null;
    if (tab === "never") return matchSearch && u.subscription === null;
    return matchSearch;
  });
  const [actionModal, setActionModal] = useState<{ type: string; user: UserItem } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const { toast } = useToast();

  const confirmAction = async () => {
    if (!actionModal) return;
    const { type, user } = actionModal;
    try {
      if (type === "delete") { await deleteUser(user.id); toast({ title: "User deleted" }); }
      else if (type === "block") { await updateUser(user.id, { status: "blocked" }); toast({ title: "User blocked" }); }
      else if (type === "activate" || type === "upgrade") {
        // Find plan duration and compute expiry
        const planInfo = adminPlans.find(p => p.name === selectedPlan);
        const expiry = planInfo
          ? new Date(Date.now() + planInfo.days * 86400000).toISOString().split("T")[0]
          : user.subscriptionExpiry;
        await updateUser(user.id, {
          status: "active",
          subscription: selectedPlan || user.subscription,
          subscriptionExpiry: expiry || null,
        });
        toast({ title: "User subscription activated", description: selectedPlan ? `${selectedPlan} until ${expiry}` : "Updated" });
      }
      else if (type === "deactivate") { await updateUser(user.id, { subscription: null, subscriptionExpiry: null }); toast({ title: "Subscription deactivated" }); }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    setActionModal(null);
    setSelectedPlan("");
  };

  const tabs = [
    { key: "all", label: `All Users (${users.length})` },
    { key: "active", label: `Active Subs (${users.filter(u => u.subscription).length})` },
    { key: "never", label: `Never Subscribed (${users.filter(u => !u.subscription).length})` },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{t.label}</button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Phone</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Subscription</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{u.name}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{u.phone}</td>
                <td className="p-3 text-center">
                  <Badge className={`text-[9px] border-0 ${u.status === "active" ? "bg-primary/20 text-primary" : u.status === "blocked" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>{u.status}</Badge>
                </td>
                <td className="p-3 text-center hidden sm:table-cell text-[10px]">{u.subscription || <span className="text-muted-foreground">None</span>}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-0.5 justify-end flex-wrap">
                    {u.status !== "blocked" && <button onClick={() => setActionModal({ type: "block", user: u })} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Ban className="w-3 h-3" /></button>}
                    {!u.subscription && <button onClick={() => setActionModal({ type: "activate", user: u })} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary"><CheckCircle className="w-3 h-3" /></button>}
                    {u.subscription && <button onClick={() => setActionModal({ type: "upgrade", user: u })} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary"><ArrowUpDown className="w-3 h-3" /></button>}
                    {u.subscription && <button onClick={() => setActionModal({ type: "deactivate", user: u })} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-accent"><AlertTriangle className="w-3 h-3" /></button>}
                    <button onClick={() => setActionModal({ type: "delete", user: u })} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {actionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-3 capitalize">{actionModal.type} User</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {actionModal.type === "delete" && `Delete ${actionModal.user.name}?`}
              {actionModal.type === "block" && `Block ${actionModal.user.name}?`}
              {actionModal.type === "deactivate" && `Deactivate subscription for ${actionModal.user.name}?`}
              {(actionModal.type === "activate" || actionModal.type === "upgrade") && `Select plan for ${actionModal.user.name}:`}
            </p>
            {(actionModal.type === "activate" || actionModal.type === "upgrade") && (
              <div className="mb-4">
                <select className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                  <option value="">-- Select Plan --</option>
                  {adminPlans.filter(p => p.type === "user").map(p => (
                    <option key={p.id} value={p.name}>{p.name} — UGX {p.price.toLocaleString()} / {p.duration}</option>
                  ))}
                </select>
                {selectedPlan && (() => {
                  const plan = adminPlans.find(p => p.name === selectedPlan);
                  if (!plan) return null;
                  const expiry = new Date(Date.now() + plan.days * 86400000).toLocaleDateString();
                  return <p className="text-[10px] text-primary mt-1">Access until: <strong>{expiry}</strong></p>;
                })()}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setActionModal(null)}>Cancel</Button>
              <Button size="sm" className={`h-8 text-xs ${actionModal.type === "delete" || actionModal.type === "block" || actionModal.type === "deactivate" ? "bg-destructive hover:bg-destructive/80" : ""}`} onClick={confirmAction}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== WALLET SECTION ====================
const WalletSection = ({ transactions, search }: { transactions: WalletTransaction[]; search: string }) => {
  // Newest first
  const sortedTx = [...transactions].sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  const filtered = sortedTx.filter(t => t.userName.toLowerCase().includes(search.toLowerCase()) || t.type.includes(search.toLowerCase()));
  const { toast } = useToast();
  const [livraBalance, setLivraBalance] = useState(0);
  const [livraTransactions, setLivraTransactions] = useState<any[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNumber, setWithdrawNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch real Livra wallet balance & transactions
  useEffect(() => {
    const load = async () => {
      setLoadingBalance(true);
      try {
        const [balData, txData] = await Promise.all([getWalletBalance(), getLivraTransactions()]);
        setLivraBalance(balData.balance);
        setLivraTransactions(Array.isArray(txData) ? txData : []);
      } catch { }
      setLoadingBalance(false);
    };
    load();
  }, []);

  const handleAdminWithdraw = async () => {
    if (!withdrawAmount || !withdrawNumber) return;
    const amt = parseInt(withdrawAmount);
    if (amt < 1000) {
      toast({ title: "Minimum UGX 1,000", variant: "destructive" });
      return;
    }
    if (amt > livraBalance) {
      toast({ title: "Insufficient Livra balance", description: `Available: UGX ${livraBalance.toLocaleString()}`, variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await requestWithdraw(withdrawNumber, amt, "LUO FILM Admin Withdrawal");
      if (!result.success) {
        toast({ title: "Withdrawal failed", description: result.error, variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      await addTransaction({
        userId: "admin",
        userName: "Admin",
        userPhone: withdrawNumber,
        type: "withdrawal",
        amount: amt,
        status: "completed",
        method: "Mobile Money (Livra)",
        description: "Admin withdrawal",
        livraRef: result.internal_reference,
        createdAt: new Date().toISOString().split("T")[0],
      } as any);

      setLivraBalance(prev => prev - amt);
      setShowWithdraw(false);
      setWithdrawAmount("");
      setWithdrawNumber("");
      toast({ title: "Withdrawal successful!", description: `UGX ${amt.toLocaleString()} sent` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const totalFirestoreBalance = transactions.filter(t => t.status === "completed").reduce((sum, t) => t.type === "withdrawal" ? sum - t.amount : sum + t.amount, 0);

  const deleteFailed = async () => {
    const failed = transactions.filter(t => t.status === "failed");
    for (const t of failed) { await deleteTransaction(t.id); }
    toast({ title: "Failed transactions cleared" });
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Livra Wallet Balance</p>
          {loadingBalance ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <p className="text-xl font-bold text-primary">{livraBalance.toLocaleString()} UGX</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Firestore Balance</p>
          <p className="text-xl font-bold text-foreground">{totalFirestoreBalance.toLocaleString()} UGX</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Transactions</p>
          <p className="text-xl font-bold text-foreground">{transactions.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Admin Actions</p>
            <div className="flex gap-1.5 mt-1">
              <Button size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowWithdraw(true)}>
                <ArrowDownToLine className="w-3 h-3" /> Withdraw
              </Button>
              <Button size="sm" variant="destructive" className="h-7 text-[10px]" onClick={deleteFailed}>
                <Trash2 className="w-3 h-3 mr-1" /> Clear Failed
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowWithdraw(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-3">Admin Withdraw</h3>
            <p className="text-muted-foreground text-[10px] mb-4">Livra Balance: <span className="text-primary font-bold">UGX {livraBalance.toLocaleString()}</span></p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Amount (UGX)</label>
                <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-muted-foreground text-[10px] block mb-1">Mobile Money Number</label>
                <input type="tel" value={withdrawNumber} onChange={e => setWithdrawNumber(e.target.value)} placeholder="e.g. 0771234567"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setShowWithdraw(false)}>Cancel</Button>
              <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleAdminWithdraw} disabled={isProcessing || !withdrawAmount || !withdrawNumber}>
                {isProcessing ? "Processing..." : "Withdraw"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">User</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Type</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Amount</th>
            <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Method</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Date</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Del</th>
          </tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{t.userName}</td>
                <td className="p-3 text-center">
                  <Badge variant="outline" className={`text-[9px] capitalize ${t.type === "subscription" ? "border-primary text-primary" : t.type === "withdrawal" ? "border-accent text-accent" : "border-muted-foreground text-muted-foreground"}`}>{t.type}</Badge>
                </td>
                <td className="p-3 text-center font-bold">{t.amount.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <Badge className={`text-[9px] border-0 ${t.status === "completed" ? "bg-primary/20 text-primary" : t.status === "failed" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent"}`}>{t.status}</Badge>
                </td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell text-[10px]">{t.method}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell text-[10px]">{t.createdAt}</td>
                <td className="p-3 text-right">
                  <button onClick={async () => { await deleteTransaction(t.id); toast({ title: "Transaction deleted" }); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== LATEST UPDATES SECTION ====================
const LatestUpdatesSection = ({ updates, search }: { updates: LatestUpdateItem[]; search: string }) => {
  const filtered = updates.filter(u => u.title.toLowerCase().includes(search.toLowerCase()));
  const [form, setForm] = useState<Partial<LatestUpdateItem>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LatestUpdateItem | null>(null);
  const { toast } = useToast();

  const openNew = () => { setForm({}); setEditing(null); setShowForm(true); };
  const openEdit = (u: LatestUpdateItem) => { setForm({ ...u }); setEditing(u); setShowForm(true); };

  const handleSave = async () => {
    try {
      if (editing) { await updateLatestUpdate(editing.id, form); toast({ title: "Update edited" }); }
      else { await addLatestUpdate(form as any); toast({ title: "Update added" }); }
      setShowForm(false);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteLatestUpdate(id); toast({ title: "Update deleted" }); } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  if (showForm) return (
    <ContentForm title={editing ? "Edit Update" : "Add Latest Update"} onClose={() => setShowForm(false)} onSave={handleSave}>
      <FormField label="Title" value={form.title || ""} onChange={v => setForm({ ...form, title: v })} />
      <FormField label="Description" value={form.description || ""} onChange={v => setForm({ ...form, description: v })} multiline />
      <FormField label="Image URL" value={form.imageUrl || ""} onChange={v => setForm({ ...form, imageUrl: v })} />
      <FormField label="Link URL (optional)" value={form.linkUrl || ""} onChange={v => setForm({ ...form, linkUrl: v })} />
    </ContentForm>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{filtered.length} updates</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openNew}><Plus className="w-3.5 h-3.5" /> Add Update</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 text-muted-foreground font-medium">Title</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Description</th>
            <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Image</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Date</th>
            <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium text-foreground">{u.title}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell line-clamp-1">{u.description}</td>
                <td className="p-3 text-center hidden sm:table-cell">{u.imageUrl ? <CheckCircle className="w-3.5 h-3.5 text-primary mx-auto" /> : <X className="w-3.5 h-3.5 text-muted-foreground mx-auto" />}</td>
                <td className="p-3 text-muted-foreground hidden md:table-cell text-[10px]">{u.createdAt}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No latest updates yet. Click "Add Update" to create one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================== SHARED COMPONENTS ====================
const ContentForm = ({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    </div>
    <div className="space-y-3 mb-5">{children}</div>
    <div className="flex gap-2 justify-end">
      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onClose}>Cancel</Button>
      <Button size="sm" className="h-8 text-xs" onClick={onSave}>Save</Button>
    </div>
  </div>
);

const FormField = ({ label, value, onChange, multiline, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string; type?: string }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    {multiline ? (
      <textarea className="w-full rounded-lg border border-border bg-secondary text-foreground text-xs px-3 py-2 min-h-[60px] resize-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    ) : (
      <Input className="h-9 text-xs bg-secondary border-border" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    )}
  </div>
);

const CheckboxField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="rounded border-border accent-primary w-3.5 h-3.5" />
    <span className="text-xs text-foreground">{label}</span>
  </label>
);

const MultiSelect = ({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
    <div className="space-y-1">
      {options.map(o => (
        <label key={o} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={selected.includes(o)} onChange={e => {
            if (e.target.checked) onChange([...selected, o]);
            else onChange(selected.filter(s => s !== o));
          }} className="rounded border-border accent-primary w-3 h-3" />
          <span className="text-[11px] text-foreground">{o}</span>
        </label>
      ))}
    </div>
  </div>
);

export default AdminDashboard;
