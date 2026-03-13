import { useState, useCallback } from "react";

export interface DeviceState {
  id: string;
  name: string;
  type: "light" | "thermostat" | "garage" | "alarm" | "camera" | "coffee" | "plug" | "lock";
  icon: string;
  state: boolean;
  detail: string;
  extra?: Record<string, string | number>;
}

export interface EventLog {
  id: string;
  time: string;
  message: string;
}

export interface Notification {
  id: string;
  time: string;
  summary: string;
  action: string;
  reason: string;
  trigger: string;
}

const now = () => {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
};

const uid = () => Math.random().toString(36).slice(2, 9);

const initialDevices: DeviceState[] = [
  { id: "lights", name: "Living Room Lights", type: "light", icon: "Lightbulb", state: true, detail: "Warm White", extra: { brightness: 80 } },
  { id: "thermostat", name: "Thermostat", type: "thermostat", icon: "Thermometer", state: true, detail: "72°F", extra: { temp: 72, mode: "Normal" } },
  { id: "garage", name: "Garage Door", type: "garage", icon: "Warehouse", state: false, detail: "Closed" },
  { id: "alarm", name: "Alarm System", type: "alarm", icon: "ShieldCheck", state: true, detail: "Armed" },
  { id: "camera", name: "Front Door Camera", type: "camera", icon: "Camera", state: true, detail: "Idle" },
  { id: "coffee", name: "Coffee Machine", type: "coffee", icon: "Coffee", state: false, detail: "Ready" },
  { id: "plug", name: "Smart Plug", type: "plug", icon: "Plug", state: true, detail: "On" },
  { id: "lock", name: "Front Door Lock", type: "lock", icon: "Lock", state: true, detail: "Locked" },
];

export function useSmartHome() {
  const [homeStatus, setHomeStatus] = useState<"Home" | "Away">("Home");
  const [temperature, setTemperature] = useState(72);
  const [automationActive, setAutomationActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(now());
  const [devices, setDevices] = useState<DeviceState[]>(initialDevices);
  const [events, setEvents] = useState<EventLog[]>([
    { id: uid(), time: now(), message: "System initialized" },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addEvent = useCallback((message: string) => {
    setEvents(prev => [{ id: uid(), time: now(), message }, ...prev].slice(0, 50));
    setLastUpdate(now());
  }, []);

  const addNotification = useCallback((n: Omit<Notification, "id" | "time">) => {
    setNotifications(prev => [{ ...n, id: uid(), time: now() }, ...prev].slice(0, 20));
  }, []);

  const toggleDevice = useCallback((deviceId: string) => {
    setDevices(prev => prev.map(d => {
      if (d.id !== deviceId) return d;
      const newState = !d.state;
      let detail = d.detail;
      if (d.type === "light") detail = newState ? "Warm White" : "Off";
      if (d.type === "garage") detail = newState ? "Open" : "Closed";
      if (d.type === "alarm") detail = newState ? "Armed" : "Disarmed";
      if (d.type === "plug") detail = newState ? "On" : "Off";
      if (d.type === "lock") detail = newState ? "Locked" : "Unlocked";
      if (d.type === "coffee") detail = newState ? "Brewing" : "Ready";
      return { ...d, state: newState, detail };
    }));
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      const newState = !device.state;
      addEvent(`${device.name} turned ${newState ? "ON" : "OFF"}`);
    }
  }, [devices, addEvent]);

  const simulateLeaving = useCallback(() => {
    setHomeStatus("Away");
    setDevices(prev => prev.map(d => {
      if (d.id === "lights") return { ...d, state: false, detail: "Off" };
      if (d.id === "alarm") return { ...d, state: true, detail: "Armed" };
      if (d.id === "lock") return { ...d, state: true, detail: "Locked" };
      if (d.id === "thermostat") return { ...d, detail: "Eco Mode", extra: { temp: 65, mode: "Eco" } };
      if (d.id === "garage") return { ...d, state: false, detail: "Closed" };
      return d;
    }));
    setTemperature(65);
    addEvent("User left home — Away mode activated");
    addEvent("Lights turned OFF");
    addEvent("Thermostat switched to Eco Mode (65°F)");
    addEvent("Garage door closed");
    addEvent("Alarm system armed");
    addEvent("Front door locked");
    addNotification({ summary: "Lights turned off", action: "Living room lights turned OFF", reason: "User left home — Away mode activated", trigger: "Home status changed to Away" });
    addNotification({ summary: "Thermostat set to Eco mode", action: "Thermostat lowered to 65°F (Eco Mode)", reason: "Energy saving when no one is home", trigger: "Home status changed to Away" });
    addNotification({ summary: "Garage door closed automatically", action: "Garage door closed", reason: "Security protocol — close all entry points when leaving", trigger: "Home status changed to Away" });
    addNotification({ summary: "Front door locked", action: "Front door lock engaged", reason: "Auto-lock on departure", trigger: "Home status changed to Away" });
  }, [addEvent, addNotification]);

  const simulateMotion = useCallback(() => {
    setDevices(prev => prev.map(d => {
      if (d.id === "camera") return { ...d, detail: "Motion Detected" };
      if (d.id === "lights" && !d.state) return { ...d, state: true, detail: "Warm White" };
      return d;
    }));
    addEvent("Motion detected at front door");
    addEvent("Front door camera activated");
    addNotification({ summary: "Motion detected at front door", action: "Camera recording started, lights turned on", reason: "Motion sensor triggered at the front entrance", trigger: "Front door motion sensor" });
    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === "camera" ? { ...d, detail: "Idle" } : d));
      addEvent("Motion sensor inactive — front door");
    }, 5000);
  }, [addEvent, addNotification]);

  const simulateTempChange = useCallback(() => {
    const newTemp = Math.round(60 + Math.random() * 25);
    setTemperature(newTemp);
    setDevices(prev => prev.map(d => {
      if (d.id === "thermostat") {
        const mode = newTemp > 78 ? "Cooling" : newTemp < 65 ? "Heating" : "Normal";
        return { ...d, detail: `${newTemp}°F`, extra: { temp: newTemp, mode } };
      }
      return d;
    }));
    addEvent(`Temperature changed to ${newTemp}°F`);
    if (newTemp > 78) {
      addNotification({ summary: "AC activated", action: `Thermostat set to cooling mode (${newTemp}°F)`, reason: "Indoor temperature exceeded 78°F threshold", trigger: "Temperature sensor" });
    } else if (newTemp < 65) {
      addNotification({ summary: "Heating activated", action: `Thermostat set to heating mode (${newTemp}°F)`, reason: "Indoor temperature dropped below 65°F threshold", trigger: "Temperature sensor" });
    }
  }, [addEvent, addNotification]);

  const simulateGarage = useCallback(() => {
    const garage = devices.find(d => d.id === "garage");
    if (!garage) return;
    const opening = !garage.state;
    setDevices(prev => prev.map(d => d.id === "garage" ? { ...d, state: opening, detail: opening ? "Open" : "Closed" } : d));
    addEvent(`Garage door ${opening ? "opened" : "closed"}`);
    if (opening && homeStatus === "Away") {
      addNotification({ summary: "Garage door opened while away", action: "Garage door opened", reason: "Unexpected — no one is home", trigger: "Garage door sensor" });
    }
  }, [devices, addEvent, addNotification, homeStatus]);

  const simulateArrive = useCallback(() => {
    setHomeStatus("Home");
    setDevices(prev => prev.map(d => {
      if (d.id === "lights") return { ...d, state: true, detail: "Warm White" };
      if (d.id === "thermostat") return { ...d, detail: "72°F", extra: { temp: 72, mode: "Normal" } };
      if (d.id === "lock") return { ...d, state: false, detail: "Unlocked" };
      return d;
    }));
    setTemperature(72);
    addEvent("User arrived home");
    addEvent("Lights turned ON — welcome mode");
    addEvent("Front door unlocked");
    addEvent("Thermostat set to 72°F");
    addNotification({ summary: "Welcome home sequence activated", action: "Lights on, door unlocked, thermostat adjusted", reason: "User arrived home", trigger: "Geofence / manual trigger" });
  }, [addEvent, addNotification]);

  return {
    homeStatus, temperature, automationActive, lastUpdate,
    devices, events, notifications,
    toggleDevice, simulateLeaving, simulateMotion, simulateTempChange, simulateGarage, simulateArrive,
    setAutomationActive,
  };
}
