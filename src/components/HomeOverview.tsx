import { Home, TreePine, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  homeStatus: "Home" | "Away";
  temperature: number;
  automationActive: boolean;
  lastUpdate: string;
}

export default function HomeOverview({ homeStatus, temperature, automationActive, lastUpdate }: Props) {
  const tempPercent = Math.min(Math.max((temperature - 50) / 40, 0), 1);
  const tempColor = temperature > 78 ? "text-destructive" : temperature < 65 ? "text-primary" : "text-success";

  return (
    <div className="glass-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Home Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Home Status */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${homeStatus === "Home" ? "bg-success/10" : "bg-warning/10"}`}>
            {homeStatus === "Home" ? <Home className="text-success" size={22} /> : <TreePine className="text-warning" size={22} />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`text-lg font-bold ${homeStatus === "Home" ? "text-success" : "text-warning"}`}>{homeStatus.toUpperCase()}</p>
          </div>
        </div>

        {/* Temperature Gauge */}
        <div className="flex items-center gap-3 col-span-1">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-secondary" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                strokeLinecap="round"
                className={tempColor.replace("text-", "stroke-")}
                strokeDasharray={`${tempPercent * 264} 264`}
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${tempPercent * 264} 264` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold font-mono ${tempColor}`}>
              {temperature}°
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Indoor Temp</p>
            <p className={`text-lg font-bold ${tempColor}`}>{temperature}°F</p>
          </div>
        </div>

        {/* Automation */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${automationActive ? "bg-primary/10" : "bg-muted"}`}>
            <Activity className={automationActive ? "text-primary" : "text-muted-foreground"} size={22} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Automation</p>
            <p className={`text-lg font-bold ${automationActive ? "text-primary" : "text-muted-foreground"}`}>
              {automationActive ? "Active" : "Idle"}
            </p>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-muted">
            <Clock className="text-muted-foreground" size={22} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Update</p>
            <p className="text-sm font-mono text-foreground">{lastUpdate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
