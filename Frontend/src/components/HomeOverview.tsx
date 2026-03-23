import { useState, useEffect } from "react";
import { Home, TreePine, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  homeStatus: "Home" | "Away";
  temperature: number;
  setTemp: number;
  automationActive: boolean;
  lastUpdate: string;
  onTempChange?: (temp: number) => void;
}

export default function HomeOverview({ homeStatus, temperature, setTemp, automationActive, lastUpdate, onTempChange }: Props) {
  const [sliderVal, setSliderVal] = useState(setTemp);

  useEffect(() => {
    setSliderVal(setTemp);
  }, [setTemp]);

  const tempPercent = Math.min(Math.max((temperature - 50) / 40, 0), 1);
  const tempColor = "text-success";

  return (
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Home Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Home Status */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10">
              {homeStatus === "Home" ? <Home className="text-success" size={22} /> : <TreePine className="text-success" size={22} />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-bold text-success">{homeStatus.toUpperCase()}</p>
            </div>
          </div>

          {/* Temperature Gauge + Slider */}
          <div className="flex items-center gap-3 col-span-1 relative">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-secondary" />
                <motion.circle
                    cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                    strokeLinecap="round"
                    className="stroke-success"
                    strokeDasharray={`${tempPercent * 264} 264`}
                    initial={{ strokeDasharray: "0 264" }}
                    animate={{ strokeDasharray: `${tempPercent * 264} 264` }}
                    transition={{ duration: 0.2, ease: "linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono text-success">
              {temperature}°
            </span>
            </div>
            <div className="flex flex-col flex-1 relative">
              <p className="text-xs text-muted-foreground">Indoor Temp</p>
              <p className={`text-lg font-bold ${tempColor}`}>{temperature}°F</p>

              {/* Dynamic Temp Badge */}
              <div className="relative mt-6">
                <div
                    className="absolute -top-6 px-2 py-1 bg-success text-white text-xs font-bold rounded-md shadow whitespace-nowrap"
                    style={{ left: `${((setTemp - 50) / 40) * 100}%`, transform: "translateX(-50%)" }}
                >
                  {setTemp}°F
                </div>

                {/* Slider */}
                <input
                    type="range"
                    min={50}
                    max={90}
                    value={sliderVal}
                    onChange={(e) => setSliderVal(Number(e.target.value))}
                    onMouseUp={() => onTempChange?.(sliderVal)}
                    onTouchEnd={() => onTempChange?.(sliderVal)}
                    className="w-full h-2 rounded-lg appearance-none bg-green-200 cursor-pointer accent-green-500"
                />
              </div>

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