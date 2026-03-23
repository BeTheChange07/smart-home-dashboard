import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
//import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Activity, HelpCircle, Bell } from "lucide-react";
import ExplanationPanel from "./ExplanationPanel";
import type { DeviceState, EventLog } from "@/hooks/useSmartHome";

interface Props {
  device: DeviceState;
  events: EventLog[];
  onClose: () => void;
  onWhatIf?: (deviceId: string, variable: string, value: number) => string;
  onSetPriority?: (deviceId: string, priority: "LOW" | "MED" | "HIGH") => void;
}

export default function DeviceDetailPanel({ device, events, onClose, onWhatIf, onSetPriority }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);
  //const deviceEvents = events.filter(e => e.deviceId === device.id).slice(0, 10);
  //const confColor = device.confidence > 0.9 ? "text-success" : device.confidence > 0.7 ? "text-warning" : "text-destructive";
  const prioLabels: Record<number, "LOW" | "MED" | "HIGH"> = { 0: "LOW", 1: "MED", 2: "HIGH" };
  const priority = prioLabels[device.priority] ?? "LOW";

  const deviceEvents = events
      .filter(e => e.deviceId === device.id);

  const handlePriority = (p: "LOW" | "MED" | "HIGH") => {
    onSetPriority?.(device.id, p);
  };

  const buttonStyle = (p: string) =>
    `px-3 py-1 text-[10px] rounded border transition-colors ${
      priority === p
        ? "bg-primary text-white border-primary"
        : "bg-secondary text-muted-foreground border-border hover:bg-secondary/70"
    }`;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-card p-5 space-y-4"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground"> {device.name} </h3>
          {/* <p className="text-xs text-muted-foreground">{device.detail} • <span className={confColor}>{Math.round(device.confidence * 100)}% confidence</span></p> */}
          <p className="text-xs text-muted-foreground"> {device.detail} </p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Sensor Inputs
<div>
  <div className="flex items-center gap-1.5 mb-2">
    <Cpu size={12} className="text-primary" />
    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">Sensor Inputs</h4>
  </div>
  <div className="grid grid-cols-2 gap-2">
    {device.sensorInputs.map((s, i) => (
      <div key={i} className="bg-secondary/50 rounded-lg px-3 py-2">
        <p className="text-[10px] text-muted-foreground">{s.name}</p>
        <p className="text-xs font-mono text-foreground">{s.value}{s.unit ? ` ${s.unit}` : ""}</p>
        {s.signalStrength && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-8 h-1 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${s.signalStrength > 90 ? "bg-success" : "bg-warning"}`} style={{ width: `${s.signalStrength}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{s.signalStrength}%</span>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
*/}

      {/* PRIORITY SELECTOR */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Bell size={12} className="text-primary" />
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Notification Priority
          </h4>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handlePriority("LOW")}
            className={buttonStyle("LOW")}
          >
            LOW
          </button>

          <button
            onClick={() => handlePriority("MED")}
            className={buttonStyle("MED")}
          >
            MED
          </button>

          <button
            onClick={() => handlePriority("HIGH")}
            className={buttonStyle("HIGH")}
          >
            HIGH
          </button>
        </div>
      </div>
      
      {/* Recent Events */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={12} className="text-primary" />
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent Events</h4>
        </div>
        <div className="max-h-[280px] overflow-y-auto">
          {deviceEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No recent events</p>
          ) : (
              <div className="space-y-1">
                {deviceEvents.map(e => (
                    <div key={e.id}
                         className="flex flex-col gap-0.5 text-[11px] py-1.5 border-b border-border/30 last:border-0">
                      <span className="font-mono text-muted-foreground">{e.time}</span>
                      <span className="text-foreground">{e.message}</span>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>

      {/* EXPLANATION BUTTON */}
      {device.lastExplanation && (
          <>
            <button
                onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-xs text-primary"
          >
            <HelpCircle size={14} />
            {showExplanation ? "Hide Explanation" : "Why did this happen?"}
          </button>

          <AnimatePresence>
            {showExplanation && (
              <ExplanationPanel
                explanation={device.lastExplanation}
                deviceName={device.name}
                onClose={() => setShowExplanation(false)}
                onWhatIf={onWhatIf ? (v, val) => onWhatIf(device.id, v, val) : undefined}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
