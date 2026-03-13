import { useState } from "react";
import { useSmartHome } from "@/hooks/useSmartHome";
import HomeOverview from "@/components/HomeOverview";
import DeviceCard from "@/components/DeviceCard";
import EventLogPanel from "@/components/EventLogPanel";
import NotificationPanel from "@/components/NotificationPanel";
import SystemStatus from "@/components/SystemStatus";
import SimulationControls from "@/components/SimulationControls";
import TrustSummary from "@/components/TrustSummary";
import DeviceDetailPanel from "@/components/DeviceDetailPanel";
import ReplayControls from "@/components/ReplayControls";
import { LayoutDashboard } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const sm = useSmartHome();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const selected = sm.devices.find(d => d.id === selectedDevice);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <LayoutDashboard className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Smart Home Control Center</h1>
          <p className="text-xs text-muted-foreground">Monitor and control your connected devices</p>
        </div>
      </header>

      {/* Overview + Trust */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <HomeOverview
            homeStatus={sm.homeStatus}
            temperature={sm.temperature}
            automationActive={true}
            lastUpdate={sm.lastUpdate}
          />
        </div>
        <TrustSummary score={sm.trustScore.score} rationale={sm.trustScore.rationale} />
      </div>

      {/* Simulation Controls */}
      <div className="mt-4">
        <SimulationControls
          homeStatus={sm.homeStatus}
          onLeave={sm.simulateLeaving}
          onArrive={sm.simulateArrive}
          onMotion={sm.simulateMotion}
          onTemp={sm.simulateTempChange}
          onGarage={sm.simulateGarage}
        />
      </div>

      {/* Device Grid + Detail Panel */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Devices</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sm.devices.map(d => (
              <DeviceCard
                key={d.id}
                device={d}
                onToggle={sm.toggleDevice}
                onSelect={setSelectedDevice}
              />
            ))}
          </div>
        </div>

        {/* Device Detail Side Panel */}
        <div>
          <AnimatePresence mode="wait">
            {selected ? (
              <DeviceDetailPanel
                key={selected.id}
                device={selected}
                events={sm.events}
                onClose={() => setSelectedDevice(null)}
                onWhatIf={sm.simulateWhatIf}
              />
            ) : (
              <div className="glass-card p-5 flex flex-col items-center justify-center min-h-[200px] text-center">
                <p className="text-sm text-muted-foreground">Click a device to view details, sensor data, and explanations</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-4">
        <SystemStatus devices={sm.devices} />
      </div>

      {/* Replay Controls */}
      <div className="mt-4">
        <ReplayControls
          history={sm.replayHistory}
          onRestore={sm.restoreSnapshot}
        />
      </div>

      {/* Event Log + Notifications */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EventLogPanel events={sm.events} />
        <NotificationPanel notifications={sm.notifications} />
      </div>
    </div>
  );
};

export default Index;
