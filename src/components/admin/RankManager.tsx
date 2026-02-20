import { useState } from "react";
import { Plus, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateSeries, updateMovie } from "@/lib/firebaseServices";
import type { SeriesItem, MovieItem } from "@/data/adminData";

interface RankManagerProps {
  series: SeriesItem[];
  movies: MovieItem[];
}

type RankedItem = { id: string; name: string; type: "series" | "movie"; rank: number; rating: number };

const RankManager = ({ series, movies }: RankManagerProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [rankNum, setRankNum] = useState("");
  const { toast } = useToast();

  // Items marked as Top Ten (ranked)
  const rankedItems: RankedItem[] = [
    ...series.filter(s => s.isTopTen).map(s => ({ id: s.id, name: s.name, type: "series" as const, rank: s.displayOrder || 0, rating: s.rating })),
    ...movies.filter(m => m.isTopTen).map(m => ({ id: m.id, name: m.name, type: "movie" as const, rank: m.displayOrder || 0, rating: m.rating })),
  ].sort((a, b) => a.rank - b.rank);

  // Unranked content
  const unranked = [
    ...series.filter(s => !s.isTopTen).map(s => ({ id: s.id, name: s.name, type: "series" as const })),
    ...movies.filter(m => !m.isTopTen).map(m => ({ id: m.id, name: m.name, type: "movie" as const })),
  ];

  const handleAdd = async () => {
    if (!selectedId || !rankNum) return;
    const item = unranked.find(a => `${a.type}-${a.id}` === selectedId);
    if (!item) return;
    try {
      const rank = parseInt(rankNum) || 1;
      if (item.type === "series") {
        await updateSeries(item.id, { isTopTen: true, displayOrder: rank });
      } else {
        await updateMovie(item.id, { isTopTen: true, displayOrder: rank });
      }
      toast({ title: `Ranked "${item.name}" at #${rank}` });
      setShowAdd(false);
      setSelectedId("");
      setRankNum("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUnrank = async (item: RankedItem) => {
    try {
      if (item.type === "series") {
        await updateSeries(item.id, { isTopTen: false });
      } else {
        await updateMovie(item.id, { isTopTen: false });
      }
      toast({ title: `Unranked "${item.name}"` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateRank = async (item: RankedItem, newRank: number) => {
    try {
      if (item.type === "series") {
        await updateSeries(item.id, { displayOrder: newRank });
      } else {
        await updateMovie(item.id, { displayOrder: newRank });
      }
      toast({ title: `Updated rank to #${newRank}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">{rankedItems.length} ranked items</p>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Add to Ranking
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-foreground mb-3">Add Content to Ranking</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Content</label>
              <select
                className="w-full h-9 rounded-lg border border-border bg-secondary text-foreground text-xs px-3"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">-- Choose Movie or Series --</option>
                <optgroup label="Series">
                  {unranked.filter(a => a.type === "series").map(a => (
                    <option key={`series-${a.id}`} value={`series-${a.id}`}>{a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Movies">
                  {unranked.filter(a => a.type === "movie").map(a => (
                    <option key={`movie-${a.id}`} value={`movie-${a.id}`}>{a.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Rank #</label>
              <Input className="h-9 text-xs bg-secondary border-border" type="number" min={1} value={rankNum} onChange={e => setRankNum(e.target.value)} placeholder="#" />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" className="h-9 text-xs" onClick={handleAdd} disabled={!selectedId || !rankNum}>Add</Button>
              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => { setShowAdd(false); setSelectedId(""); setRankNum(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-center p-3 text-muted-foreground font-medium w-16">Rank</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
              <th className="text-center p-3 text-muted-foreground font-medium">Type</th>
              <th className="text-center p-3 text-muted-foreground font-medium hidden sm:table-cell">Rating</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rankedItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 text-center">
                  <Input
                    className="h-7 w-14 text-xs text-center bg-secondary border-border mx-auto"
                    type="number"
                    min={1}
                    defaultValue={item.rank || idx + 1}
                    onBlur={e => {
                      const val = parseInt(e.target.value);
                      if (val && val !== item.rank) handleUpdateRank(item, val);
                    }}
                  />
                </td>
                <td className="p-3 font-medium text-foreground flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-accent shrink-0" />
                  {item.name}
                </td>
                <td className="p-3 text-center">
                  <Badge className={`text-[9px] border-0 ${item.type === "series" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                    {item.type}
                  </Badge>
                </td>
                <td className="p-3 text-center hidden sm:table-cell">
                  <span className="text-accent">{item.rating}</span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => handleUnrank(item)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive" title="Remove from ranking">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {rankedItems.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No ranked items. Click "Add to Ranking" to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankManager;
