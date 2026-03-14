import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Rewind, Play, SkipForward, History } from "lucide-react";

interface Snapshot {
  time: string;
  snapshot: any[];
}

interface Props {
  history: Snapshot[];
  onRestore: (index: number) => void;
}

export default function ReplayControls({ history, onRestore }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const handleSlider = (val: number[]) => {
    setIndex(val[0]);
  };

  const handlePlay = () => {
    if (history.length < 2) return;
    setPlaying(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= history.length) {
        clearInterval(interval);
        setPlaying(false);
        return;
      }
      setIndex(i);
      onRestore(i);
    }, 1500);
  };

  const stepTo = (i: number) => {
    const clamped = Math.max(0, Math.min(i, history.length - 1));
    setIndex(clamped);
    onRestore(clamped);
  };

  if (history.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-2">
          <History size={16} className="text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Automation Sandbox / Replay</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          No snapshots yet. Use simulation controls to generate history, then replay and step through events.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History size={16} className="text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Automation Sandbox / Replay</h3>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{history.length} snapshots</span>
        <span>•</span>
        <span className="font-mono">Current: {index + 1} / {history.length}</span>
        {history[index] && <span>• <span className="text-foreground font-mono">{history[index].time}</span></span>}
      </div>

      <Slider
        min={0}
        max={Math.max(history.length - 1, 0)}
        step={1}
        value={[index]}
        onValueChange={handleSlider}
        disabled={playing}
      />

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => stepTo(index - 1)} disabled={playing || index <= 0} className="gap-1">
          <Rewind size={14} /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={handlePlay} disabled={playing || history.length < 2} className="gap-1">
          <Play size={14} /> {playing ? "Playing..." : "Play"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => stepTo(index + 1)} disabled={playing || index >= history.length - 1} className="gap-1">
          <SkipForward size={14} /> Next
        </Button>
      </div>
    </div>
  );
}
