import type { DeviceState } from "@/hooks/useSmartHome";

interface Props {
  devices: DeviceState[];
}

const statusDevices = ["garage", "alarm", "coffee", "plug"];

export default function SystemStatus({ devices }: Props) {
  const filtered = devices.filter(d => statusDevices.includes(d.id));

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">System Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filtered.map(d => (
          <div key={d.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
            <span className={`status-dot ${d.state ? (d.id === "garage" ? "status-dot-warning" : "status-dot-active") : (d.id === "alarm" ? "status-dot-alert" : "status-dot-inactive")}`} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.name}</p>
              <p className="text-xs font-mono font-medium text-foreground">{d.detail.toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
