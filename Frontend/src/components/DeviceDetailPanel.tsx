import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function DeviceDetailPanel({
  device,
  events,
  onClose,
  onWhatIf,
  onSetPriority
}: Props) {

  const [showExplanation, setShowExplanation] = useState(false);
  const [priority, setPriority] = useState<"LOW" | "MED" | "HIGH">("LOW");

  const deviceEvents = events
    .filter(e => e.deviceId === device.id)
    .slice(0, 10);

  const handlePriority = (p: "LOW" | "MED" | "HIGH") => {
    setPriority(p);
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
          <h3 className="text-sm font-semibold text-foreground">
            {device.name}
          </h3>

          <p className="text-xs text-muted-foreground">
            {device.detail}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-secondary transition-colors"
        >
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>


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


      {/* RECENT EVENTS */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity size={12} className="text-primary" />
          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent Events
          </h4>
        </div>

        <ScrollArea className="max-h-[160px]">

          {deviceEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              No recent events
            </p>
          ) : (
            <div className="space-y-1">

              {deviceEvents.map(e => (
                <div
                  key={e.id}
                  className="flex gap-2 text-xs py-1 border-b border-border/30 last:border-0"
                >
                  <span className="font-mono text-muted-foreground shrink-0">
                    {e.time}
                  </span>

                  <span className="text-foreground">
                    {e.message}
                  </span>
                </div>
              ))}

            </div>
          )}

        </ScrollArea>
      </div>


      {/* EXPLANATION BUTTON */}
      {device.lastExplanation && (
        <>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-xs text-primary"
          >
            <HelpCircle size={14} />

            {showExplanation
              ? "Hide Explanation"
              : "Why did this happen?"}

          </button>

          <AnimatePresence>
            {showExplanation && (
              <ExplanationPanel
                explanation={device.lastExplanation}
                deviceName={device.name}
                onClose={() => setShowExplanation(false)}
                onWhatIf={
                  onWhatIf
                    ? (v, val) => onWhatIf(device.id, v, val)
                    : undefined
                }
              />
            )}
          </AnimatePresence>
        </>
      )}

    </motion.div>
  );
}