import { useSmartHome } from "@/hooks/useSmartHome";
import DeviceCard from "@/components/DeviceCard";
import NotificationPanel from "@/components/NotificationPanel";

export default function AdminPanel() {

  const sm = useSmartHome();

  return (
    <div className="min-h-screen p-6 max-w-[1440px] mx-auto">

      <div className="flex items-center justify-between mb-6">

        <h1 className="text-xl font-bold text-foreground">
          Smart Home Control Center
        </h1>

        <span className="text-red-500 font-bold">
          ADMIN
        </span>

      </div>

      {/* Device Control */}
      <div className="mb-6">

        <h2 className="text-sm font-semibold mb-3">
          Device Control
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {sm.devices.map(d => (
            <DeviceCard
              key={d.id}
              device={d}
              onToggle={sm.toggleDevice}
              onSelect={() => {}}
            />
          ))}

        </div>

      </div>

      {/* Notifications */}
      <NotificationPanel notifications={sm.notifications} />

    </div>
  );
}