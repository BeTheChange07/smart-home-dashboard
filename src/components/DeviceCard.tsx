import { memo } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import {
  Lightbulb, Thermometer, Warehouse, ShieldCheck,
  Camera, Coffee, Plug, Lock,
} from "lucide-react";
import type { DeviceState } from "@/hooks/useSmartHome";

const iconMap: Record<string, React.FC<{ className?: string; size?: number }>> = {
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
}

function DeviceCard({ device, onToggle }: Props) {
  const Icon = iconMap[device.icon] || Plug;
  const color = device.state ? stateColors[device.type] || "text-primary" : "text-muted-foreground";
  const isAlert = device.detail === "Motion Detected" || (device.type === "garage" && device.state);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 flex flex-col gap-3 transition-all duration-300 ${
        device.state ? "border-border" : "border-border/50 opacity-75"
      } ${isAlert ? "ring-1 ring-destructive/40" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${device.state ? "bg-secondary" : "bg-muted"}`}>
          <Icon className={color} size={20} />
        </div>
        <Switch
          checked={device.state}
          onCheckedChange={() => onToggle(device.id)}
          className="data-[state=checked]:bg-success"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground leading-tight">{device.name}</p>
        <p className={`text-xs mt-0.5 font-mono ${isAlert ? "text-destructive" : "text-muted-foreground"}`}>
          {device.detail}
        </p>
      </div>
      <div className="flex items-center gap-1.5 mt-auto">
        <span className={`status-dot ${device.state ? (isAlert ? "status-dot-alert" : "status-dot-active") : "status-dot-inactive"}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {device.state ? (isAlert ? "Alert" : "Active") : "Off"}
        </span>
      </div>
    </motion.div>
  );
}

export default memo(DeviceCard);
