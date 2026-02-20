import { useState } from "react";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateSeries, updateMovie } from "@/lib/firebaseServices";
import type { SeriesItem, MovieItem } from "@/data/adminData";

interface SelectionManagerProps {
  series: SeriesItem[];
  movies: MovieItem[];
}

type ContentItem = { id: string; name: string; type: "series" | "movie"; categories: string[]; dramaSelectionPosition?: number | null };

const SelectionManager = ({ series, movies }: SelectionManagerProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [position, setPosition] = useState("");
  const { toast } = useToast();

  // Build list of currently selected items (those with "Drama Selection" category)
  const selectedItems: ContentItem[] = [
    ...series.filter(s => s.categories?.includes("Drama Selection")).map(s => ({ id: s.id, name: s.name, type: "series" as const, categories: s.categories, dramaSelectionPosition: s.dramaSelectionPosition })),
    ...movies.filter(m => m.categories?.includes("Drama Selection")).map(m => ({ id: m.id, name: m.name, type: "movie" as const, categories: m.categories, dramaSelectionPosition: null })),
  ].sort((a, b) => (a.dramaSelectionPosition || 999) - (b.dramaSelectionPosition || 999));

  // All available content not yet in selection
  const available = [
    ...series.filter(s => !s.categories?.includes("Drama Selection")).map(s => ({ id: s.id, name: s.name, type: "series" as const })),
    ...movies.filter(m => !m.categories?.includes("Drama Selection")).map(m => ({ id: m.id, name: m.name, type: "movie" as const })),
  ];

  const handleAdd = async () => {
    if (!selectedId || !position) return;
    const item = available.find(a => `${a.type}-${a.id}` === selectedId);
    if (!item) return;
    try {
      const pos = parseInt(position) || 1;
      if (item.type === "series") {
        const s = series.find(s => s.id === item.id)!;
        await updateSeries(item.id, { categories: [...(s.categories || []), "Drama Selection"], dramaSelectionPosition: pos });
      } else {
        const m = movies.find(m => m.id === item.id)!;
        await updateMovie(item.id, { categories: [...(m.categories || []), "Drama Selection"] });
      }
      toast({ title: `Added "${item.name}" to selection at #${pos}` });
      setShowAdd(false);
      setSelectedId("");
      setPosition("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRemove = async (item: ContentItem) => {
    try {
      const newCategories = (item.categories || []).filter(c => c !== "Drama Selection");
      if (item.type === "series") {
        await updateSeries(item.id, { categories: newCategories, dramaSelectionPosition: null });
      } else {
        await updateMovie(item.id, { categories: newCategories });
      }
      toast({ title: `Removed "${item.name}" from selection` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdatePosition = async (item: ContentItem, newPos: number) => {
    try {
      if (item.type === "series") {
        await updateSeries(item.id, { dramaSelectionPosition: newPos });
      }
      toast({ title: `Updated position to #${newPos}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs text-muted-foreground">{selectedItems.length} items in selection (max 100)</p>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowAdd(true)} disabled={selectedItems.length >= 100}>
          <Plus className="w-3.5 h-3.5" /> Add to Selection
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h3 className="text-xs font-bold text-foreground mb-3">Add Content to Selection</h3>
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
                  {available.filter(a => a.type === "series").map(a => (
                    <option key={`series-${a.id}`} value={`series-${a.id}`}>{a.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Movies">
                  {available.filter(a => a.type === "movie").map(a => (
                    <option key={`movie-${a.id}`} value={`movie-${a.id}`}>{a.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Position #</label>
              <Input className="h-9 text-xs bg-secondary border-border" type="number" min={1} max={100} value={position} onChange={e => setPosition(e.target.value)} placeholder="#" />
            </div>
            <div className="flex items-end gap-2">
              <Button size="sm" className="h-9 text-xs" onClick={handleAdd} disabled={!selectedId || !position}>Add</Button>
              <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => { setShowAdd(false); setSelectedId(""); setPosition(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-center p-3 text-muted-foreground font-medium w-16">#</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Name</th>
              <th className="text-center p-3 text-muted-foreground font-medium">Type</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 text-center">
                  <Input
                    className="h-7 w-14 text-xs text-center bg-secondary border-border mx-auto"
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={item.dramaSelectionPosition || idx + 1}
                    onBlur={e => {
                      const val = parseInt(e.target.value);
                      if (val && val !== item.dramaSelectionPosition) handleUpdatePosition(item, val);
                    }}
                  />
                </td>
                <td className="p-3 font-medium text-foreground">{item.name}</td>
                <td className="p-3 text-center">
                  <Badge className={`text-[9px] border-0 ${item.type === "series" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                    {item.type}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => handleRemove(item)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {selectedItems.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">No items in selection. Click "Add to Selection" to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelectionManager;
