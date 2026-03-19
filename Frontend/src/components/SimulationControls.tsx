import { Button } from "@/components/ui/button";
import { LogOut, Eye, Thermometer, Warehouse, Home } from "lucide-react";

interface Props {
  homeStatus: "Home" | "Away";
  onLeave: () => void;
  onArrive: () => void;
  onMotion: () => void;
  onTemp: () => void;
  onGarage: () => void;
}

export default function SimulationControls({ homeStatus, onLeave, onArrive, onMotion, onTemp, onGarage }: Props) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Simulation Controls</h3>
      <div className="flex flex-wrap gap-2">
        {homeStatus === "Home" ? (
          <Button variant="outline" size="sm" onClick={onLeave} className="gap-1.5">
            <LogOut size={14} /> Leave Home
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onArrive} className="gap-1.5">
            <Home size={14} /> Arrive Home
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onMotion} className="gap-1.5">
          <Eye size={14} /> Motion Detected
        </Button>
        <Button variant="outline" size="sm" onClick={onTemp} className="gap-1.5">
          <Thermometer size={14} /> Temp Change
        </Button>
        <Button variant="outline" size="sm" onClick={onGarage} className="gap-1.5">
          <Warehouse size={14} /> Toggle Garage
        </Button>
      </div>
    </div>
  );
}
