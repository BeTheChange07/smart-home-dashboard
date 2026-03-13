import { useState, useCallback, useMemo } from "react";

export interface SensorInput {
  sensorId: string;
  name: string;
  value: number | string;
  unit?: string;
  timestamp: string;
  signalStrength?: number;
  firmware?: string;
}

export interface CausalNode {
  id: string;
  label: string;
  type: "sensor" | "rule" | "ai_model" | "action";
  value?: string;
}

export interface CausalEdge {
  from: string;
  to: string;
}

export interface Explanation {
  why: string;
  whyNot?: string;
  whatIf?: string;
  provenance: {
    sources: SensorInput[];
    ruleId?: string;
    ruleName?: string;
    modelVersion?: string;
  };
  confidence: number;
  confidenceLabel: string;
  causalGraph: {
    nodes: CausalNode[];
    edges: CausalEdge[];
  };
  suggestedFix?: string;
  counterfactual?: {
    variable: string;
    currentValue: number;
    alternativeValue: number;
    wouldFire: boolean;
    description: string;
  };
}

export interface DeviceState {
  id: string;
  name: string;
  type: "light" | "thermostat" | "garage" | "alarm" | "camera" | "coffee" | "plug" | "lock";
  icon: string;
  state: boolean;
  detail: string;
  extra?: Record<string, string | number>;
  confidence: number;
  confidenceLabel: string;
  lastExplanation?: Explanation;
  sensorInputs: SensorInput[];
}

export interface EventLog {
  id: string;
  time: string;
  message: string;
  deviceId?: string;
  explanation?: Explanation;
}

export interface Notification {
  id: string;
  time: string;
  summary: string;
  action: string;
  reason: string;
  trigger: string;
  explanation?: Explanation;
}

const now = () => {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
};

const uid = () => Math.random().toString(36).slice(2, 9);

const makeSensor = (sensorId: string, name: string, value: number | string, unit?: string): SensorInput => ({
  sensorId, name, value, unit, timestamp: now(), signalStrength: 85 + Math.floor(Math.random() * 15), firmware: "v2.4.1",
});

const makeExplanation = (
  why: string,
  sensors: SensorInput[],
  nodes: CausalNode[],
  edges: CausalEdge[],
  opts: Partial<Omit<Explanation, "why" | "provenance" | "causalGraph">> = {}
): Explanation => ({
  why,
  confidence: opts.confidence ?? 0.85,
  confidenceLabel: opts.confidenceLabel ?? "High",
  whyNot: opts.whyNot,
  whatIf: opts.whatIf,
  provenance: { sources: sensors, ruleId: opts.suggestedFix ? "rule_" + uid() : undefined, ruleName: "Automation Rule" },
  causalGraph: { nodes, edges },
  suggestedFix: opts.suggestedFix,
  counterfactual: opts.counterfactual,
});

const defaultSensors: Record<string, SensorInput[]> = {
  lights: [makeSensor("motion_lr", "Living Room Motion", 0.9, "occupancy"), makeSensor("lux_lr", "Ambient Light", 45, "lux")],
  thermostat: [makeSensor("temp_indoor", "Indoor Temp Sensor", 72, "°F"), makeSensor("temp_outdoor", "Outdoor Temp Sensor", 58, "°F")],
  garage: [makeSensor("garage_sensor", "Garage Door Sensor", "closed", ""), makeSensor("proximity", "Vehicle Proximity", 0, "m")],
  alarm: [makeSensor("door_sensor", "Door Sensor", "closed", ""), makeSensor("window_sensor", "Window Sensor", "closed", "")],
  camera: [makeSensor("motion_fd", "Front Door Motion", 0, ""), makeSensor("ir_sensor", "IR Sensor", "idle", "")],
  coffee: [makeSensor("water_level", "Water Level", 80, "%"), makeSensor("schedule", "Morning Schedule", "07:00", "")],
  plug: [makeSensor("power_draw", "Power Draw", 45, "W"), makeSensor("schedule_plug", "Schedule", "always_on", "")],
  lock: [makeSensor("lock_sensor", "Lock State Sensor", "locked", ""), makeSensor("bluetooth", "Bluetooth Proximity", 0.1, "m")],
};

const initialDevices: DeviceState[] = [
  { id: "lights", name: "Living Room Lights", type: "light", icon: "Lightbulb", state: true, detail: "Warm White", extra: { brightness: 80 }, confidence: 0.92, confidenceLabel: "High", sensorInputs: defaultSensors.lights },
  { id: "thermostat", name: "Thermostat", type: "thermostat", icon: "Thermometer", state: true, detail: "72°F", extra: { temp: 72, mode: "Normal" }, confidence: 0.95, confidenceLabel: "Very High", sensorInputs: defaultSensors.thermostat },
  { id: "garage", name: "Garage Door", type: "garage", icon: "Warehouse", state: false, detail: "Closed", confidence: 0.98, confidenceLabel: "Very High", sensorInputs: defaultSensors.garage },
  { id: "alarm", name: "Alarm System", type: "alarm", icon: "ShieldCheck", state: true, detail: "Armed", confidence: 0.97, confidenceLabel: "Very High", sensorInputs: defaultSensors.alarm },
  { id: "camera", name: "Front Door Camera", type: "camera", icon: "Camera", state: true, detail: "Idle", confidence: 0.88, confidenceLabel: "High", sensorInputs: defaultSensors.camera },
  { id: "coffee", name: "Coffee Machine", type: "coffee", icon: "Coffee", state: false, detail: "Ready", confidence: 0.80, confidenceLabel: "Moderate", sensorInputs: defaultSensors.coffee },
  { id: "plug", name: "Smart Plug", type: "plug", icon: "Plug", state: true, detail: "On", confidence: 0.90, confidenceLabel: "High", sensorInputs: defaultSensors.plug },
  { id: "lock", name: "Front Door Lock", type: "lock", icon: "Lock", state: true, detail: "Locked", confidence: 0.96, confidenceLabel: "Very High", sensorInputs: defaultSensors.lock },
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
  const [replayHistory, setReplayHistory] = useState<{ time: string; snapshot: DeviceState[] }[]>([]);

  const trustScore = useMemo(() => {
    const avg = devices.reduce((s, d) => s + d.confidence, 0) / devices.length;
    const rationale = avg > 0.9 ? "All systems operating within normal parameters with high sensor reliability."
      : avg > 0.75 ? "Most systems nominal; some sensors showing moderate confidence."
      : "Several sensors reporting low confidence — review recommended.";
    return { score: Math.round(avg * 100), rationale };
  }, [devices]);

  const addEvent = useCallback((message: string, deviceId?: string, explanation?: Explanation) => {
    setEvents(prev => [{ id: uid(), time: now(), message, deviceId, explanation }, ...prev].slice(0, 50));
    setLastUpdate(now());
  }, []);

  const addNotification = useCallback((n: Omit<Notification, "id" | "time">) => {
    setNotifications(prev => [{ ...n, id: uid(), time: now() }, ...prev].slice(0, 20));
  }, []);

  const saveSnapshot = useCallback(() => {
    setReplayHistory(prev => [...prev, { time: now(), snapshot: JSON.parse(JSON.stringify(devices)) }].slice(-50));
  }, [devices]);

  const toggleDevice = useCallback((deviceId: string) => {
    saveSnapshot();
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
      addEvent(`${device.name} turned ${newState ? "ON" : "OFF"}`, deviceId);
    }
  }, [devices, addEvent, saveSnapshot]);

  const simulateLeaving = useCallback(() => {
    saveSnapshot();
    setHomeStatus("Away");
    const motionSensor = makeSensor("motion_lr", "Living Room Motion", 0, "occupancy");
    const geoSensor = makeSensor("geofence", "Geofence", "outside", "");

    const lightsExpl = makeExplanation(
      "Lights turned off because user left home and no occupancy was detected in any room.",
      [motionSensor, geoSensor],
      [
        { id: "geo", label: "Geofence: Outside", type: "sensor", value: "outside" },
        { id: "motion", label: "Motion: 0", type: "sensor", value: "0" },
        { id: "rule", label: "Away Mode Rule", type: "rule" },
        { id: "action", label: "Lights OFF", type: "action" },
      ],
      [{ from: "geo", to: "rule" }, { from: "motion", to: "rule" }, { from: "rule", to: "action" }],
      {
        whyNot: "Lights would have stayed on if motion was detected (occupancy > 0.3).",
        whatIf: "If someone was still home, only unused rooms would dim.",
        confidence: 0.95, confidenceLabel: "Very High",
        suggestedFix: "To keep lights on when leaving, disable 'Auto-off on departure' in Settings.",
        counterfactual: { variable: "occupancy", currentValue: 0, alternativeValue: 0.5, wouldFire: false, description: "If occupancy had been 0.5, lights would have stayed on." },
      }
    );

    const thermoExpl = makeExplanation(
      "Thermostat switched to Eco Mode because no one is home and outside temperature is moderate.",
      [makeSensor("temp_outdoor", "Outdoor Temp", 58, "°F"), geoSensor],
      [
        { id: "geo", label: "Geofence: Outside", type: "sensor", value: "outside" },
        { id: "temp", label: "Outdoor: 58°F", type: "sensor", value: "58" },
        { id: "rule", label: "Eco Mode Rule", type: "rule" },
        { id: "action", label: "Set 65°F Eco", type: "action" },
      ],
      [{ from: "geo", to: "rule" }, { from: "temp", to: "rule" }, { from: "rule", to: "action" }],
      { confidence: 0.93, confidenceLabel: "High", whyNot: "It didn't set to heating because outdoor temp > 40°F.", counterfactual: { variable: "outdoor_temp", currentValue: 58, alternativeValue: 30, wouldFire: true, description: "If outdoor temp was 30°F, heating mode would activate instead of eco." } }
    );

    setDevices(prev => prev.map(d => {
      if (d.id === "lights") return { ...d, state: false, detail: "Off", lastExplanation: lightsExpl, sensorInputs: [motionSensor, ...d.sensorInputs.slice(1)] };
      if (d.id === "alarm") return { ...d, state: true, detail: "Armed", confidence: 0.97 };
      if (d.id === "lock") return { ...d, state: true, detail: "Locked", confidence: 0.96 };
      if (d.id === "thermostat") return { ...d, detail: "Eco Mode", extra: { temp: 65, mode: "Eco" }, lastExplanation: thermoExpl };
      if (d.id === "garage") return { ...d, state: false, detail: "Closed" };
      return d;
    }));
    setTemperature(65);
    addEvent("User left home — Away mode activated", undefined, lightsExpl);
    addEvent("Lights turned OFF", "lights", lightsExpl);
    addEvent("Thermostat switched to Eco Mode (65°F)", "thermostat", thermoExpl);
    addEvent("Garage door closed", "garage");
    addEvent("Alarm system armed", "alarm");
    addEvent("Front door locked", "lock");
    addNotification({ summary: "Lights turned off", action: "Living room lights turned OFF", reason: "User left home — Away mode activated", trigger: "Geofence sensor", explanation: lightsExpl });
    addNotification({ summary: "Thermostat set to Eco mode", action: "Thermostat lowered to 65°F (Eco Mode)", reason: "Energy saving when no one is home", trigger: "Home status changed to Away", explanation: thermoExpl });
    addNotification({ summary: "Garage door closed automatically", action: "Garage door closed", reason: "Security protocol — close all entry points when leaving", trigger: "Home status changed to Away" });
    addNotification({ summary: "Front door locked", action: "Front door lock engaged", reason: "Auto-lock on departure", trigger: "Home status changed to Away" });
  }, [addEvent, addNotification, saveSnapshot]);

  const simulateMotion = useCallback(() => {
    saveSnapshot();
    const motionVal = 0.85 + Math.random() * 0.15;
    const motionSensor = makeSensor("motion_fd", "Front Door Motion", Number(motionVal.toFixed(2)), "confidence");
    const irSensor = makeSensor("ir_sensor", "IR Sensor", "active", "");

    const expl = makeExplanation(
      `Motion detected at front door with ${(motionVal * 100).toFixed(0)}% confidence. Camera activated and lights turned on for security.`,
      [motionSensor, irSensor],
      [
        { id: "motion", label: `Motion: ${motionVal.toFixed(2)}`, type: "sensor", value: motionVal.toFixed(2) },
        { id: "ir", label: "IR: Active", type: "sensor", value: "active" },
        { id: "ai", label: "Motion AI Model", type: "ai_model" },
        { id: "cam", label: "Camera: Record", type: "action" },
        { id: "light", label: "Lights: ON", type: "action" },
      ],
      [{ from: "motion", to: "ai" }, { from: "ir", to: "ai" }, { from: "ai", to: "cam" }, { from: "ai", to: "light" }],
      {
        confidence: motionVal, confidenceLabel: motionVal > 0.9 ? "Very High" : "High",
        whyNot: "It didn't trigger the alarm because the system is in Home mode and motion at the front door is expected.",
        whatIf: "If the system was in Away mode, the alarm would also sound and a notification would be sent to your phone.",
        suggestedFix: "To disable motion lights, edit 'Motion Response' rule.",
        counterfactual: { variable: "motion_confidence", currentValue: Number(motionVal.toFixed(2)), alternativeValue: 0.3, wouldFire: false, description: "If motion confidence was below 0.5, camera would not activate." },
      }
    );

    setDevices(prev => prev.map(d => {
      if (d.id === "camera") return { ...d, detail: "Motion Detected", lastExplanation: expl, confidence: motionVal, confidenceLabel: motionVal > 0.9 ? "Very High" : "High", sensorInputs: [motionSensor, irSensor] };
      if (d.id === "lights" && !d.state) return { ...d, state: true, detail: "Warm White", lastExplanation: expl };
      return d;
    }));
    addEvent("Motion detected at front door", "camera", expl);
    addEvent("Front door camera activated", "camera");
    addNotification({ summary: "Motion detected at front door", action: "Camera recording started, lights turned on", reason: "Motion sensor triggered at the front entrance", trigger: "Front door motion sensor", explanation: expl });
    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === "camera" ? { ...d, detail: "Idle" } : d));
      addEvent("Motion sensor inactive — front door", "camera");
    }, 5000);
  }, [addEvent, addNotification, saveSnapshot]);

  const simulateTempChange = useCallback(() => {
    saveSnapshot();
    const newTemp = Math.round(60 + Math.random() * 25);
    const indoorSensor = makeSensor("temp_indoor", "Indoor Temp Sensor", newTemp, "°F");
    const outdoorSensor = makeSensor("temp_outdoor", "Outdoor Temp Sensor", Math.round(40 + Math.random() * 30), "°F");

    const mode = newTemp > 78 ? "Cooling" : newTemp < 65 ? "Heating" : "Normal";
    const expl = makeExplanation(
      `Temperature changed to ${newTemp}°F. ${mode === "Cooling" ? "AC activated because indoor temp exceeded 78°F threshold." : mode === "Heating" ? "Heating activated because indoor temp dropped below 65°F." : "Temperature within comfort range, no HVAC action needed."}`,
      [indoorSensor, outdoorSensor],
      [
        { id: "indoor", label: `Indoor: ${newTemp}°F`, type: "sensor", value: `${newTemp}` },
        { id: "outdoor", label: `Outdoor: ${outdoorSensor.value}°F`, type: "sensor", value: `${outdoorSensor.value}` },
        { id: "rule", label: "HVAC Control Rule", type: "rule" },
        { id: "action", label: `Mode: ${mode}`, type: "action" },
      ],
      [{ from: "indoor", to: "rule" }, { from: "outdoor", to: "rule" }, { from: "rule", to: "action" }],
      {
        confidence: 0.91, confidenceLabel: "High",
        whyNot: mode === "Normal" ? "HVAC didn't activate because temperature is within 65-78°F comfort range." : undefined,
        whatIf: newTemp > 78 ? "If you set the threshold to 80°F, the AC would not have activated." : newTemp < 65 ? "If you close the windows, heating would be more efficient." : "Lowering the upper threshold would trigger cooling sooner.",
        suggestedFix: `To adjust comfort range, modify 'HVAC Thresholds' in Settings (currently 65-78°F).`,
        counterfactual: { variable: "indoor_temp", currentValue: newTemp, alternativeValue: 72, wouldFire: false, description: "At 72°F, no HVAC action would be taken." },
      }
    );

    setTemperature(newTemp);
    setDevices(prev => prev.map(d => {
      if (d.id === "thermostat") {
        return { ...d, detail: `${newTemp}°F`, extra: { temp: newTemp, mode }, lastExplanation: expl, sensorInputs: [indoorSensor, outdoorSensor], confidence: 0.91 };
      }
      return d;
    }));
    addEvent(`Temperature changed to ${newTemp}°F`, "thermostat", expl);
    if (newTemp > 78) {
      addNotification({ summary: "AC activated", action: `Thermostat set to cooling mode (${newTemp}°F)`, reason: "Indoor temperature exceeded 78°F threshold", trigger: "Temperature sensor", explanation: expl });
    } else if (newTemp < 65) {
      addNotification({ summary: "Heating activated", action: `Thermostat set to heating mode (${newTemp}°F)`, reason: "Indoor temperature dropped below 65°F threshold", trigger: "Temperature sensor", explanation: expl });
    }
  }, [addEvent, addNotification, saveSnapshot]);

  const simulateGarage = useCallback(() => {
    saveSnapshot();
    const garage = devices.find(d => d.id === "garage");
    if (!garage) return;
    const opening = !garage.state;

    const proxSensor = makeSensor("proximity", "Vehicle Proximity", opening ? 2.5 : 0, "m");
    const expl = makeExplanation(
      `Garage door ${opening ? "opened" : "closed"} ${opening ? "— vehicle detected approaching" : "— no vehicle detected, auto-close triggered"}.`,
      [proxSensor, makeSensor("garage_sensor", "Garage Door Sensor", opening ? "open" : "closed", "")],
      [
        { id: "prox", label: `Proximity: ${proxSensor.value}m`, type: "sensor", value: `${proxSensor.value}` },
        { id: "rule", label: "Garage Auto Rule", type: "rule" },
        { id: "action", label: `Door: ${opening ? "Open" : "Close"}`, type: "action" },
      ],
      [{ from: "prox", to: "rule" }, { from: "rule", to: "action" }],
      {
        confidence: 0.88, confidenceLabel: "High",
        whyNot: opening ? "It didn't keep the door closed because vehicle proximity was > 2m." : undefined,
        counterfactual: { variable: "proximity", currentValue: Number(proxSensor.value), alternativeValue: 0, wouldFire: !opening, description: opening ? "With no vehicle detected, door would stay closed." : "With a vehicle approaching, door would open instead." },
      }
    );

    setDevices(prev => prev.map(d => d.id === "garage" ? { ...d, state: opening, detail: opening ? "Open" : "Closed", lastExplanation: expl, sensorInputs: [proxSensor, ...d.sensorInputs.slice(1)] } : d));
    addEvent(`Garage door ${opening ? "opened" : "closed"}`, "garage", expl);
    if (opening && homeStatus === "Away") {
      addNotification({ summary: "Garage door opened while away", action: "Garage door opened", reason: "Unexpected — no one is home", trigger: "Garage door sensor", explanation: expl });
    }
  }, [devices, addEvent, addNotification, homeStatus, saveSnapshot]);

  const simulateArrive = useCallback(() => {
    saveSnapshot();
    setHomeStatus("Home");
    const geoSensor = makeSensor("geofence", "Geofence", "inside", "");
    const expl = makeExplanation(
      "Welcome home sequence activated because geofence detected user within home radius.",
      [geoSensor],
      [
        { id: "geo", label: "Geofence: Inside", type: "sensor", value: "inside" },
        { id: "rule", label: "Welcome Home Rule", type: "rule" },
        { id: "lights", label: "Lights: ON", type: "action" },
        { id: "lock", label: "Door: Unlock", type: "action" },
        { id: "thermo", label: "Thermostat: 72°F", type: "action" },
      ],
      [{ from: "geo", to: "rule" }, { from: "rule", to: "lights" }, { from: "rule", to: "lock" }, { from: "rule", to: "thermo" }],
      { confidence: 0.94, confidenceLabel: "High", suggestedFix: "Customize welcome scene in 'Arrival Settings'." }
    );

    setDevices(prev => prev.map(d => {
      if (d.id === "lights") return { ...d, state: true, detail: "Warm White", lastExplanation: expl };
      if (d.id === "thermostat") return { ...d, detail: "72°F", extra: { temp: 72, mode: "Normal" }, lastExplanation: expl };
      if (d.id === "lock") return { ...d, state: false, detail: "Unlocked", lastExplanation: expl };
      return d;
    }));
    setTemperature(72);
    addEvent("User arrived home", undefined, expl);
    addEvent("Lights turned ON — welcome mode", "lights", expl);
    addEvent("Front door unlocked", "lock");
    addEvent("Thermostat set to 72°F", "thermostat");
    addNotification({ summary: "Welcome home sequence activated", action: "Lights on, door unlocked, thermostat adjusted", reason: "User arrived home", trigger: "Geofence / manual trigger", explanation: expl });
  }, [addEvent, addNotification, saveSnapshot]);

  const simulateWhatIf = useCallback((deviceId: string, variable: string, newValue: number): string => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.lastExplanation?.counterfactual) return "No counterfactual data available for this device.";
    const cf = device.lastExplanation.counterfactual;
    if (variable === cf.variable) {
      if (Math.abs(newValue - cf.alternativeValue) < Math.abs(newValue - cf.currentValue)) {
        return `With ${variable} = ${newValue}: ${cf.wouldFire ? "Action WOULD fire." : "Action would NOT fire."} ${cf.description}`;
      }
      return `With ${variable} = ${newValue}: Original action would still ${cf.wouldFire ? "not fire" : "fire"} as the value is closer to the original.`;
    }
    return `Simulation for ${variable} = ${newValue}: Behavior unchanged — this variable doesn't affect the current decision.`;
  }, [devices]);

  const restoreSnapshot = useCallback((index: number) => {
    if (index < 0 || index >= replayHistory.length) return;
    setDevices(replayHistory[index].snapshot);
    addEvent(`Restored snapshot from ${replayHistory[index].time}`);
  }, [replayHistory, addEvent]);

  return {
    homeStatus, temperature, automationActive, lastUpdate,
    devices, events, notifications, trustScore, replayHistory,
    toggleDevice, simulateLeaving, simulateMotion, simulateTempChange, simulateGarage, simulateArrive,
    simulateWhatIf, restoreSnapshot,
    setAutomationActive,
  };
}
