import { memo } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import {
  Lightbulb, Thermometer, Warehouse, ShieldCheck,
  Camera, Coffee, Plug, Lock, HelpCircle,
} from "lucide-react";
import type { DeviceState } from "@/hooks/useSmartHome";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Lightbulb, Thermometer, Warehouse, ShieldCheck, Camera, Coffee, Plug, Lock,
};

const stateColors: Record<string, string> = {
  light: "text-warning",
  thermostat: "text-primary",
  garage: "text-accent",
  alarm: "text-success",
  camera: "text-primary",
  coffee: "text-warning",
  plug: "text-success",
  lock: "text-success",
};

interface Props {
  device: DeviceState;
  onToggle: (id: string) => void;
  onSelect?: (id: string) => void;
}

function DeviceCard({ device, onToggle, onSelect }: Props) {
  const Icon = iconMap[device.icon] || Plug;
  const color = device.state ? stateColors[device.type] || "text-primary" : "text-muted-foreground";
  const isAlert = device.detail === "Motion Detected" || (device.type === "garage" && device.state);

  // Confidence LED color
  const confLed = device.confidence > 0.9 ? "bg-success" : device.confidence > 0.7 ? "bg-warning" : "bg-destructive";
  const confGlow = device.confidence > 0.9 ? "var(--glow-success)" : device.confidence > 0.7 ? "var(--glow-warning)" : "var(--glow-destructive)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 flex flex-col gap-3 transition-all duration-300 cursor-pointer ${
        device.state ? "border-border" : "border-border/50 opacity-75"
      } ${isAlert ? "ring-1 ring-destructive/40" : ""}`}
      onClick={() => onSelect?.(device.id)}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${device.state ? "bg-secondary" : "bg-muted"}`}>
          <Icon className={color} size={20} />
        </div>
        <div className="flex items-center gap-2">
          {/* Confidence LED */}
          <div className="flex flex-col items-center gap-0.5" title={`${Math.round(device.confidence * 100)}% confidence`}>
            <span className={`w-2 h-2 rounded-full ${confLed}`} style={{ boxShadow: confGlow }} />
            <span className="text-[8px] font-mono text-muted-foreground">{Math.round(device.confidence * 100)}%</span>
          </div>
          <Switch
            checked={device.state}
            onCheckedChange={(e) => {
              e && undefined; // prevent event bubbling issues
              onToggle(device.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-success"
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground leading-tight">{device.name}</p>
        <p className={`text-xs mt-0.5 font-mono ${isAlert ? "text-destructive" : "text-muted-foreground"}`}>
          {device.detail}
        </p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${device.state ? (isAlert ? "status-dot-alert" : "status-dot-active") : "status-dot-inactive"}`} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {device.state ? (isAlert ? "Alert" : "Active") : "Off"}
          </span>
        </div>
        {device.lastExplanation && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(device.id); }}
            className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
            title="Why did this happen?"
          >
            <HelpCircle size={12} /> Why?
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default memo(DeviceCard);
