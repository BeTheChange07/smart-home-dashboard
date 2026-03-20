import { useState, useCallback, useMemo, useEffect } from "react";

// used to get the API or use localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


// =============================================================================
// TYPE DEFINITIONS (interfaces)
// These define the SHAPE of data used throughout the app.
// They don't contain logic -- they just say "an object of this type must have
// these fields with these types."
// =============================================================================

// Represents a single sensor reading (e.g., a temperature sensor, motion detector)
export interface SensorInput {
  sensorId: string;          // unique ID for the sensor hardware
  name: string;              // human-readable name like "Living Room Motion"
  value: number | string;    // the sensor's reading (e.g., 72 for temp, "closed" for door)
  unit?: string;             // optional unit like "°F", "lux", "%"
  timestamp: string;         // when the reading was taken
  signalStrength?: number;   // optional wireless signal quality
  firmware?: string;         // optional firmware version of the sensor
}

// A node in the causal explanation graph (used to show WHY a decision was made)
// The causal graph is a visual chain: sensor -> rule/AI -> action
export interface CausalNode {
  id: string;
  label: string;
  type: "sensor" | "rule" | "ai_model" | "action";  // what kind of node
  value?: string;
}

// A directed edge connecting two nodes in the causal graph
export interface CausalEdge {
  from: string;  // source node ID
  to: string;    // target node ID
}

// The core XAI (Explainable AI) data structure.
// Every automated action in the smart home gets one of these attached to it
// so the user can understand WHY the system did something.
export interface Explanation {
  why: string;              // "Lights turned off because user left home"
  whyNot?: string;          // "Lights would have stayed on if motion was detected"
  whatIf?: string;           // "If someone was still home, only unused rooms would dim"
  provenance: {              // where the decision came from
    sources: SensorInput[];  // which sensors contributed to this decision
    ruleId?: string;         // which automation rule triggered it
    ruleName?: string;
    modelVersion?: string;   // if an AI model was involved, which version
  };
  confidence: number;        // 0-1 score of how confident the system is
  confidenceLabel: string;   // "High", "Very High", "Moderate"
  causalGraph: {             // the visual cause-and-effect chain
    nodes: CausalNode[];
    edges: CausalEdge[];
  };
  suggestedFix?: string;     // tip for the user if they want to change the behavior
  counterfactual?: {         // "what if this variable had been different?"
    variable: string;        // which variable we're hypothetically changing
    currentValue: number;    // what it actually was
    alternativeValue: number;// the hypothetical value
    wouldFire: boolean;      // would the action still happen with the alt value?
    description: string;     // plain English description
  };
}

// Represents a single smart home device (light, thermostat, lock, etc.)
export interface DeviceState {
  id: string;                       // unique device ID like "lights", "thermostat"
  name: string;                     // display name like "Living Room Lights"
  type: "light" | "thermostat" | "garage" | "alarm" | "camera" | "coffee" | "plug" | "lock";
  icon: string;                     // icon name for the UI (maps to lucide-react icons)
  state: boolean;                   // ON (true) or OFF (false)
  detail: string;                   // status text like "Warm White", "72°F", "Locked"
  extra?: Record<string, string | number>;  // additional data like { brightness: 80 }
  confidence: number;               // how confident the system is in this device's state
  confidenceLabel: string;
  lastExplanation?: Explanation;    // the most recent explanation for this device's action
  sensorInputs: SensorInput[];     // the sensors feeding data to this device
}

// A single entry in the event log (history of what happened)
export interface EventLog {
  id: string;
  time: string;
  message: string;               // "Lights turned ON — welcome mode"
  deviceId?: string;             // which device this event is about
  explanation?: Explanation;     // optional XAI explanation attached to this event
  priority?: "LOW" | "MED" | "HIGH";
}

// A user-facing notification (more prominent than an event log entry)
export interface Notification {
  id: string;
  time: string;
  summary: string;       // short title like "Motion detected at front door"
  action: string;        // what the system did: "Camera recording started"
  reason: string;        // why: "Motion sensor triggered at the front entrance"
  trigger: string;       // what caused it: "Front door motion sensor"
  explanation?: Explanation;
}

// =============================================================================
// UTILITY FUNCTIONS
// Small helpers used throughout the hook
// =============================================================================

// Returns the current time as a formatted string like "14:23:05"
const now = () => {
  const d = new Date();
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate().toString().padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  return `${month} ${day}, ${year} ${time}`;
};

// Generates a short random ID like "k3xm9f2" for unique keys
const uid = () => Math.random().toString(36).slice(2, 9);

// Factory function: creates a SensorInput object with auto-generated timestamp
// and randomized signal strength (simulating real sensor data)
const makeSensor = (sensorId: string, name: string, value: number | string, unit?: string): SensorInput => ({
  sensorId, name, value, unit, timestamp: now(), signalStrength: 85 + Math.floor(Math.random() * 15), firmware: "v2.4.1",
});

// Factory function: creates an Explanation object.
// This is called every time the system takes an automated action, so the UI
// can show the user a full cause-and-effect breakdown.
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




// =============================================================================
// THE MAIN HOOK
// This is the "brain" of the app. It holds all state and exposes functions
// that components call when buttons are pressed.
// =============================================================================

export function useSmartHome() {

  // ---- STATE VARIABLES ----
  // These are the reactive values that the UI reads from and displays.
  // When any of these change, React re-renders the components using them.

  const [homeStatus, setHomeStatus] = useState<"Home" | "Away">("Home");  // is the user home or away?
  const [temperature, setTemperature] = useState(72);                      // current thermostat temp
  //const [automationActive, setAutomationActive] = useState(true);          // are automations enabled?
  const [lastUpdate, setLastUpdate] = useState(now());                     // timestamp of last change
  const [devices, setDevices] = useState<DeviceState[]>([]);                // the 8 devices and their states from json file
  const [events, setEvents] = useState<EventLog[]>([                       // event history log
    { id: uid(), time: now(), message: "System initialized" },
  ]);
  const [notifications, setNotifications] = useState<Notification[]>([]);  // user-facing notifications
  const [replayHistory, setReplayHistory] = useState<{ time: string; snapshot: DeviceState[] }[]>([]); // time-travel snapshots

  // ---- COMPUTED VALUE: TRUST SCORE ----
  // useMemo recalculates this only when `devices` changes.
  // It averages all device confidence scores into one system-wide trust score.
  const trustScore = useMemo(() => {
    const avg = devices.reduce((s, d) => s + d.confidence, 0) / devices.length;
    const rationale = avg > 0.9 ? "All systems operating within normal parameters with high sensor reliability."
        : avg > 0.75 ? "Most systems nominal; some sensors showing moderate confidence."
            : "Several sensors reporting low confidence — review recommended.";
    return { score: Math.round(avg * 100), rationale };
  }, [devices]);

  // ---- HELPER: ADD EVENT ----
  // Adds a new entry to the event log. Keeps max 50 entries (oldest get dropped).
  //const addEvent = useCallback((message: string, deviceId?: string, explanation?: Explanation) => {
  //  setEvents(prev => [{ id: uid(), time: now(), message, deviceId, explanation }, ...prev].slice(0, 50));
  //  setLastUpdate(now());
  //}, []);


  const addEvent = useCallback(
  (
    message: string,
    deviceId?: string,
    explanation?: Explanation,
    priority: "LOW" | "MED" | "HIGH" = "LOW"
  ) => {
    const event: EventLog = {
      id: uid(),
      time: now(),
      message,
      deviceId,
      explanation,
      priority,
    };

    setEvents(prev => [event, ...prev].slice(0, 50));
    setLastUpdate(now());

    fetch("http://localhost:5000/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(err => console.error("Failed to log event:", err));
  },
  []
);



  // ---- HELPER: ADD NOTIFICATION ----
  // Adds a user-facing notification. Keeps max 20.
  const addNotification = useCallback((n: Omit<Notification, "id" | "time">) => {
    setNotifications(prev => [{ ...n, id: uid(), time: now() }, ...prev].slice(0, 20));
  }, []);

  const setNotificationPriority = useCallback(
  (deviceId: string, priority: "LOW" | "MED" | "HIGH") => {
    setEvents(prev =>
      prev.map(e =>
        e.deviceId === deviceId
          ? { ...e, priority }
          : e
      )
    );
  },
  []
);
  // ---- HELPER: SAVE SNAPSHOT ----
  // Deep-copies the current device states into replayHistory.
  // This is called BEFORE any state change so the user can "go back in time."
  const saveSnapshot = useCallback(() => {
    setReplayHistory(prev => [...prev, { time: now(), snapshot: JSON.parse(JSON.stringify(devices)) }].slice(-50));
  }, [devices]);

  // ---- HELPER: FETCH BACKEND STATE ----
  // Gets the backend state of the state.json file for initialization
  const fetchBackendState = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/state`);
      const data = await res.json();
      const built: DeviceState[] = [];

      // data.Lights is an array in state.json: [{Id: "LivingRoom", State: true}, ...]
      // We loop through and create one DeviceState per light
      for (const light of data.Lights ?? []) {
        built.push({
          id: `Lights-${light.Id}`,
          name: `${light.Id} Lights`,
          type: "light",
          icon: "Lightbulb",
          state: light.State,
          detail: light.State ? "Warm White" : "Off",
          confidence: 0.92,
          confidenceLabel: "High",
          sensorInputs: [makeSensor(`motion_${light.Id}`, `${light.Id} Motion`, light.State ? 0.9 : 0, "occupancy")],
        });
      }



      // data.Thermostat is a single object: {State: true, CurrentTemp: 75}
      if (data.Thermostat) {
        built.push({
          id: "Thermostat",
          name: "Thermostat",
          type: "thermostat",
          icon: "Thermometer",
          state: data.Thermostat.State,
          detail: `${data.Thermostat.CurrentTemp}°F`,
          extra: { temp: data.Thermostat.CurrentTemp, mode: "Normal" },
          confidence: 0.95,
          confidenceLabel: "Very High",
          sensorInputs: [makeSensor("temp_indoor", "Indoor Temp Sensor", data.Thermostat.CurrentTemp, "°F")],
        });
        setTemperature(data.Thermostat.CurrentTemp);
      }

      // data.GarageDoor is a single object: {State: false}
      if (data.GarageDoor) {
        built.push({
          id: "GarageDoor",
          name: "Garage Door",
          type: "garage",
          icon: "Warehouse",
          state: data.GarageDoor.State,
          detail: data.GarageDoor.State ? "Open" : "Closed",
          confidence: 0.98,
          confidenceLabel: "Very High",
          sensorInputs: [makeSensor("garage_sensor", "Garage Door Sensor", data.GarageDoor.State ? "open" : "closed", "")],
        });
      }

      // data.Locks is an array: [{Id: "FrontDoor", State: true}, ...]
      for (const lock of data.Locks ?? []) {
        built.push({
          id: `Locks-${lock.Id}`,
          name: `${lock.Id} Lock`,
          type: "lock",
          icon: "Lock",
          state: lock.State,
          detail: lock.State ? "Locked" : "Unlocked",
          confidence: 0.96,
          confidenceLabel: "Very High",
          sensorInputs: [makeSensor(`lock_${lock.Id}`, `${lock.Id} Lock Sensor`, lock.State ? "locked" : "unlocked", "")],
        });
      }

      // data.FrontDoorCam is a single object: {State: false}
      if (data.FrontDoorCam) {
        built.push({
          id: "FrontDoorCam",
          name: "Front Door Camera",
          type: "camera",
          icon: "Camera",
          state: data.FrontDoorCam.State,
          detail: data.FrontDoorCam.State ? "Active" : "Idle",
          confidence: 0.88,
          confidenceLabel: "High",
          sensorInputs: [makeSensor("motion_fd", "Front Door Motion", 0, "")],
        });
      }

      // data.CoffeeMachine is a single object: {State: true}
      if (data.CoffeeMachine) {
        built.push({
          id: "CoffeeMachine",
          name: "Coffee Machine",
          type: "coffee",
          icon: "Coffee",
          state: data.CoffeeMachine.State,
          detail: data.CoffeeMachine.State ? "Brewing" : "Ready",
          confidence: 0.80,
          confidenceLabel: "Moderate",
          sensorInputs: [makeSensor("water_level", "Water Level", 80, "%")],
        });
      }

      // data.SmartPlugs is an array: [{Id: "LivingRoom", State: true}, ...]
      for (const plug of data.SmartPlugs ?? []) {
        built.push({
          id: `SmartPlugs-${plug.Id}`,
          name: `${plug.Id} Smart Plug`,
          type: "plug",
          icon: "Plug",
          state: plug.State,
          detail: plug.State ? "On" : "Off",
          confidence: 0.90,
          confidenceLabel: "High",
          sensorInputs: [makeSensor(`power_${plug.Id}`, `${plug.Id} Power Draw`, 45, "W")],
        });
      }

      // Replace the empty devices array with everything we built
      setDevices(built);

      // fetch events from back end
      try {
        const eventsRes = await fetch(`${API_URL}/events`);
        const savedEvents = await eventsRes.json();
        if (savedEvents.length > 0) {
          const parsed = savedEvents.map((e: string | Record<string, unknown>) =>
              typeof e === "string" ? JSON.parse(e) : e
          );
          const mapped = parsed.map((e: Record<string, unknown>) => {
            let time = e.time as string;
            const parts = time.split(" ");
            if (parts.length === 6) {
              time = `${parts[0]} ${parts[1]}, ${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
            }
            return {
              id: e.id as string,
              time,
              message: e.message as string,
              deviceId: (e.deviceID ?? e.deviceId) as string | undefined,
            };
          });
          setEvents(prev => {
            // For each backend event, remove any
            // local event that has the same deviceId and was created within
            // 10 seconds (these are duplicates from the button press).
            const backendIds = new Set(mapped.map((e: EventLog) => e.id));
            const backendDeviceTimes = new Map<string, string>();
            for (const be of mapped) {
              if (be.deviceId) backendDeviceTimes.set(be.deviceId, be.time);
            }

            const localOnly = prev.filter(e => {
              // Already in backend by id, drop it
              if (backendIds.has(e.id)) return false;
              // Local event for same device within 10s of a backend event, drop it
              if (e.deviceId && backendDeviceTimes.has(e.deviceId)) {
                const bTime = backendDeviceTimes.get(e.deviceId)!;
                if (Math.abs(new Date(bTime).getTime() - new Date(e.time).getTime()) < 10000) {
                  return false;
                }
              }
              return true;
            });

            return [...localOnly, ...mapped].sort((a, b) =>
                b.time.localeCompare(a.time)
            ).slice(0, 50);
          });
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      }



    } catch (err) {
      console.error("Failed to fetch backend state:", err);
    }


  }, []);



  useEffect(() => {
    fetchBackendState(); // run immediately on load

    // Then re-fetch every 3 seconds to pick up external changes
    const interval = setInterval(() => {
      fetchBackendState();
    }, 3000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [fetchBackendState]);

  // ==========================================================================
  // TOGGLE DEVICE (called when the Switch is flipped in DeviceCard.tsx)
  //
  // This We'll change the state of the state.json file when a button is pressed.
  // ==========================================================================

  const toggleDevice = useCallback(async (deviceId: string) => {
    saveSnapshot();

    // Figure out which Flask endpoint to PATCH based on the device ID
    let url = "";

    if (deviceId.startsWith("Lights-")) {
      const name = deviceId.replace("Lights-", "");
      url = `${API_URL}/lights/${name}`;

    } else if (deviceId.startsWith("Locks-")) {
      const name = deviceId.replace("Locks-", "");
      url = `${API_URL}/locks/${name}`;

    } else if (deviceId.startsWith("SmartPlugs-")) {
      const name = deviceId.replace("SmartPlugs-", "");
      url = `${API_URL}/smartPlug/${name}`;

    } else if (deviceId === "Thermostat") {
      url = `${API_URL}/thermostat`;

    } else if (deviceId === "GarageDoor") {
      url = `${API_URL}/garage`;

    } else if (deviceId === "CoffeeMachine") {
      url = `${API_URL}/coffeeMachine`;

    } else if (deviceId === "FrontDoorCam") {
      url = `${API_URL}/frontDoorCam`;
    }

    // Send the PATCH request to Flask, which toggles the state in state.json
    try {
      const device = devices.find(d => d.id === deviceId);
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Reason: `Changed by user` }),
      });
      const newState = await res.text(); // Flask returns "True" or "False" as a string

      // Thermostat returns "True,75" (state + temp), others return just "True"/"False"
      const isOn = newState.trim().startsWith("True");

      // Update local React state to match what the backend now has
      setDevices(prev => prev.map(d => {
        if (d.id !== deviceId) return d;

        let detail = d.detail;
        if (d.type === "light") detail = isOn ? "Warm White" : "Off";
        if (d.type === "garage") detail = isOn ? "Open" : "Closed";
        if (d.type === "lock") detail = isOn ? "Locked" : "Unlocked";
        if (d.type === "plug") detail = isOn ? "On" : "Off";
        if (d.type === "coffee") detail = isOn ? "Brewing" : "Ready";
        if (d.type === "camera") detail = isOn ? "Active" : "Idle";

        return { ...d, state: isOn, detail };
      }));


      await fetchBackendState();

    } catch (err) {
      console.error("Failed to toggle device:", err);
    }
  }, [devices, addEvent, saveSnapshot]);


  // // ==========================================================================
  // // SIMULATE LEAVING HOME
  // // Triggered by a button in SimulationControls.tsx.
  // // Sets status to "Away" and runs a full departure sequence:
  // //   - Turns off lights (with explanation)
  // //   - Arms alarm
  // //   - Locks front door
  // //   - Closes garage
  // //   - Sets thermostat to Eco mode (with explanation)
  // //   - Logs events and sends notifications for each action
  // // ==========================================================================
  // const simulateLeaving = useCallback(() => {
  //   saveSnapshot();
  //   setHomeStatus("Away");
  //
  //   // Create fake sensor readings for this scenario
  //   const motionSensor = makeSensor("motion_lr", "Living Room Motion", 0, "occupancy");
  //   const geoSensor = makeSensor("geofence", "Geofence", "outside", "");
  //
  //   // Build an XAI explanation for why the lights turned off
  //   const lightsExpl = makeExplanation(
  //       "Lights turned off because user left home and no occupancy was detected in any room.",
  //       [motionSensor, geoSensor],
  //       [
  //         { id: "geo", label: "Geofence: Outside", type: "sensor", value: "outside" },
  //         { id: "motion", label: "Motion: 0", type: "sensor", value: "0" },
  //         { id: "rule", label: "Away Mode Rule", type: "rule" },
  //         { id: "action", label: "Lights OFF", type: "action" },
  //       ],
  //       [{ from: "geo", to: "rule" }, { from: "motion", to: "rule" }, { from: "rule", to: "action" }],
  //       {
  //         whyNot: "Lights would have stayed on if motion was detected (occupancy > 0.3).",
  //         whatIf: "If someone was still home, only unused rooms would dim.",
  //         confidence: 0.95, confidenceLabel: "Very High",
  //         suggestedFix: "To keep lights on when leaving, disable 'Auto-off on departure' in Settings.",
  //         counterfactual: { variable: "occupancy", currentValue: 0, alternativeValue: 0.5, wouldFire: false, description: "If occupancy had been 0.5, lights would have stayed on." },
  //       }
  //   );
  //
  //   // Build an XAI explanation for why the thermostat switched to Eco mode
  //   const thermoExpl = makeExplanation(
  //       "Thermostat switched to Eco Mode because no one is home and outside temperature is moderate.",
  //       [makeSensor("temp_outdoor", "Outdoor Temp", 58, "°F"), geoSensor],
  //       [
  //         { id: "geo", label: "Geofence: Outside", type: "sensor", value: "outside" },
  //         { id: "temp", label: "Outdoor: 58°F", type: "sensor", value: "58" },
  //         { id: "rule", label: "Eco Mode Rule", type: "rule" },
  //         { id: "action", label: "Set 65°F Eco", type: "action" },
  //       ],
  //       [{ from: "geo", to: "rule" }, { from: "temp", to: "rule" }, { from: "rule", to: "action" }],
  //       { confidence: 0.93, confidenceLabel: "High", whyNot: "It didn't set to heating because outdoor temp > 40°F.", counterfactual: { variable: "outdoor_temp", currentValue: 58, alternativeValue: 30, wouldFire: true, description: "If outdoor temp was 30°F, heating mode would activate instead of eco." } }
  //   );
  //
  //   // Update ALL affected devices at once
  //   setDevices(prev => prev.map(d => {
  //     if (d.id === "lights") return { ...d, state: false, detail: "Off", lastExplanation: lightsExpl, sensorInputs: [motionSensor, ...d.sensorInputs.slice(1)] };
  //     if (d.id === "alarm") return { ...d, state: true, detail: "Armed", confidence: 0.97 };
  //     if (d.id === "lock") return { ...d, state: true, detail: "Locked", confidence: 0.96 };
  //     if (d.id === "thermostat") return { ...d, detail: "Eco Mode", extra: { temp: 65, mode: "Eco" }, lastExplanation: thermoExpl };
  //     if (d.id === "garage") return { ...d, state: false, detail: "Closed" };
  //     return d;  // other devices unchanged
  //   }));
  //
  //   setTemperature(65);
  //
  //   // Log events for each action taken
  //   addEvent("User left home — Away mode activated", undefined, lightsExpl);
  //   addEvent("Lights turned OFF", "lights", lightsExpl);
  //   addEvent("Thermostat switched to Eco Mode (65°F)", "thermostat", thermoExpl);
  //   addEvent("Garage door closed", "garage");
  //   addEvent("Alarm system armed", "alarm");
  //   addEvent("Front door locked", "lock");
  //
  //   // Send user-facing notifications for each action
  //   addNotification({ summary: "Lights turned off", action: "Living room lights turned OFF", reason: "User left home — Away mode activated", trigger: "Geofence sensor", explanation: lightsExpl });
  //   addNotification({ summary: "Thermostat set to Eco mode", action: "Thermostat lowered to 65°F (Eco Mode)", reason: "Energy saving when no one is home", trigger: "Home status changed to Away", explanation: thermoExpl });
  //   addNotification({ summary: "Garage door closed automatically", action: "Garage door closed", reason: "Security protocol — close all entry points when leaving", trigger: "Home status changed to Away" });
  //   addNotification({ summary: "Front door locked", action: "Front door lock engaged", reason: "Auto-lock on departure", trigger: "Home status changed to Away" });
  // }, [addEvent, addNotification, saveSnapshot]);
  //
  // // ==========================================================================
  // // SIMULATE MOTION AT FRONT DOOR
  // // Generates a random motion confidence value, creates sensor data,
  // // activates the camera, turns on lights, and sends a notification.
  // // After 5 seconds, resets the camera to "Idle."
  // // ==========================================================================
  // const simulateMotion = useCallback(() => {
  //   saveSnapshot();
  //
  //   // Random motion confidence between 0.85 and 1.0
  //   const motionVal = 0.85 + Math.random() * 0.15;
  //   const motionSensor = makeSensor("motion_fd", "Front Door Motion", Number(motionVal.toFixed(2)), "confidence");
  //   const irSensor = makeSensor("ir_sensor", "IR Sensor", "active", "");
  //
  //   // Build explanation with a causal graph:
  //   // motion sensor + IR sensor -> AI Model -> camera recording + lights on
  //   const expl = makeExplanation(
  //       `Motion detected at front door with ${(motionVal * 100).toFixed(0)}% confidence. Camera activated and lights turned on for security.`,
  //       [motionSensor, irSensor],
  //       [
  //         { id: "motion", label: `Motion: ${motionVal.toFixed(2)}`, type: "sensor", value: motionVal.toFixed(2) },
  //         { id: "ir", label: "IR: Active", type: "sensor", value: "active" },
  //         { id: "ai", label: "Motion AI Model", type: "ai_model" },
  //         { id: "cam", label: "Camera: Record", type: "action" },
  //         { id: "light", label: "Lights: ON", type: "action" },
  //       ],
  //       [{ from: "motion", to: "ai" }, { from: "ir", to: "ai" }, { from: "ai", to: "cam" }, { from: "ai", to: "light" }],
  //       {
  //         confidence: motionVal, confidenceLabel: motionVal > 0.9 ? "Very High" : "High",
  //         whyNot: "It didn't trigger the alarm because the system is in Home mode and motion at the front door is expected.",
  //         whatIf: "If the system was in Away mode, the alarm would also sound and a notification would be sent to your phone.",
  //         suggestedFix: "To disable motion lights, edit 'Motion Response' rule.",
  //         counterfactual: { variable: "motion_confidence", currentValue: Number(motionVal.toFixed(2)), alternativeValue: 0.3, wouldFire: false, description: "If motion confidence was below 0.5, camera would not activate." },
  //       }
  //   );
  //
  //   // Update camera to "Motion Detected" and turn on lights if they were off
  //   setDevices(prev => prev.map(d => {
  //     if (d.id === "camera") return { ...d, detail: "Motion Detected", lastExplanation: expl, confidence: motionVal, confidenceLabel: motionVal > 0.9 ? "Very High" : "High", sensorInputs: [motionSensor, irSensor] };
  //     if (d.id === "lights" && !d.state) return { ...d, state: true, detail: "Warm White", lastExplanation: expl };
  //     return d;
  //   }));
  //
  //   addEvent("Motion detected at front door", "camera", expl);
  //   addEvent("Front door camera activated", "camera");
  //   addNotification({ summary: "Motion detected at front door", action: "Camera recording started, lights turned on", reason: "Motion sensor triggered at the front entrance", trigger: "Front door motion sensor", explanation: expl });
  //
  //   // After 5 seconds, reset camera back to idle (simulating motion ending)
  //   setTimeout(() => {
  //     setDevices(prev => prev.map(d => d.id === "camera" ? { ...d, detail: "Idle" } : d));
  //     addEvent("Motion sensor inactive — front door", "camera");
  //   }, 5000);
  // }, [addEvent, addNotification, saveSnapshot]);
  //
  // // ==========================================================================
  // // SIMULATE TEMPERATURE CHANGE
  // // Picks a random temp between 60-85, determines if HVAC should heat/cool,
  // // updates the thermostat device, and notifies the user.
  // // ==========================================================================
  // const simulateTempChange = useCallback(() => {
  //   saveSnapshot();
  //
  //   // Random temp between 60 and 85
  //   const newTemp = Math.round(60 + Math.random() * 25);
  //   const indoorSensor = makeSensor("temp_indoor", "Indoor Temp Sensor", newTemp, "°F");
  //   const outdoorSensor = makeSensor("temp_outdoor", "Outdoor Temp Sensor", Math.round(40 + Math.random() * 30), "°F");
  //
  //   // Decide HVAC mode based on thresholds: >78 = Cooling, <65 = Heating, else Normal
  //   const mode = newTemp > 78 ? "Cooling" : newTemp < 65 ? "Heating" : "Normal";
  //
  //   const expl = makeExplanation(
  //       `Temperature changed to ${newTemp}°F. ${mode === "Cooling" ? "AC activated because indoor temp exceeded 78°F threshold." : mode === "Heating" ? "Heating activated because indoor temp dropped below 65°F." : "Temperature within comfort range, no HVAC action needed."}`,
  //       [indoorSensor, outdoorSensor],
  //       [
  //         { id: "indoor", label: `Indoor: ${newTemp}°F`, type: "sensor", value: `${newTemp}` },
  //         { id: "outdoor", label: `Outdoor: ${outdoorSensor.value}°F`, type: "sensor", value: `${outdoorSensor.value}` },
  //         { id: "rule", label: "HVAC Control Rule", type: "rule" },
  //         { id: "action", label: `Mode: ${mode}`, type: "action" },
  //       ],
  //       [{ from: "indoor", to: "rule" }, { from: "outdoor", to: "rule" }, { from: "rule", to: "action" }],
  //       {
  //         confidence: 0.91, confidenceLabel: "High",
  //         whyNot: mode === "Normal" ? "HVAC didn't activate because temperature is within 65-78°F comfort range." : undefined,
  //         whatIf: newTemp > 78 ? "If you set the threshold to 80°F, the AC would not have activated." : newTemp < 65 ? "If you close the windows, heating would be more efficient." : "Lowering the upper threshold would trigger cooling sooner.",
  //         suggestedFix: `To adjust comfort range, modify 'HVAC Thresholds' in Settings (currently 65-78°F).`,
  //         counterfactual: { variable: "indoor_temp", currentValue: newTemp, alternativeValue: 72, wouldFire: false, description: "At 72°F, no HVAC action would be taken." },
  //       }
  //   );
  //
  //   setTemperature(newTemp);
  //   setDevices(prev => prev.map(d => {
  //     if (d.id === "thermostat") {
  //       return { ...d, detail: `${newTemp}°F`, extra: { temp: newTemp, mode }, lastExplanation: expl, sensorInputs: [indoorSensor, outdoorSensor], confidence: 0.91 };
  //     }
  //     return d;
  //   }));
  //
  //   addEvent(`Temperature changed to ${newTemp}°F`, "thermostat", expl);
  //
  //   // Only notify if HVAC actually kicked in
  //   if (newTemp > 78) {
  //     addNotification({ summary: "AC activated", action: `Thermostat set to cooling mode (${newTemp}°F)`, reason: "Indoor temperature exceeded 78°F threshold", trigger: "Temperature sensor", explanation: expl });
  //   } else if (newTemp < 65) {
  //     addNotification({ summary: "Heating activated", action: `Thermostat set to heating mode (${newTemp}°F)`, reason: "Indoor temperature dropped below 65°F threshold", trigger: "Temperature sensor", explanation: expl });
  //   }
  // }, [addEvent, addNotification, saveSnapshot]);
  //
  // // ==========================================================================
  // // SIMULATE GARAGE DOOR TOGGLE
  // // Flips the garage open/closed with proximity sensor data.
  // // Sends an alert notification if the garage opens while the user is Away.
  // // ==========================================================================
  // const simulateGarage = useCallback(() => {
  //   saveSnapshot();
  //   const garage = devices.find(d => d.id === "garage");
  //   if (!garage) return;
  //   const opening = !garage.state;  // if currently closed, we're opening it
  //
  //   const proxSensor = makeSensor("proximity", "Vehicle Proximity", opening ? 2.5 : 0, "m");
  //   const expl = makeExplanation(
  //       `Garage door ${opening ? "opened" : "closed"} ${opening ? "— vehicle detected approaching" : "— no vehicle detected, auto-close triggered"}.`,
  //       [proxSensor, makeSensor("garage_sensor", "Garage Door Sensor", opening ? "open" : "closed", "")],
  //       [
  //         { id: "prox", label: `Proximity: ${proxSensor.value}m`, type: "sensor", value: `${proxSensor.value}` },
  //         { id: "rule", label: "Garage Auto Rule", type: "rule" },
  //         { id: "action", label: `Door: ${opening ? "Open" : "Close"}`, type: "action" },
  //       ],
  //       [{ from: "prox", to: "rule" }, { from: "rule", to: "action" }],
  //       {
  //         confidence: 0.88, confidenceLabel: "High",
  //         whyNot: opening ? "It didn't keep the door closed because vehicle proximity was > 2m." : undefined,
  //         counterfactual: { variable: "proximity", currentValue: Number(proxSensor.value), alternativeValue: 0, wouldFire: !opening, description: opening ? "With no vehicle detected, door would stay closed." : "With a vehicle approaching, door would open instead." },
  //       }
  //   );
  //
  //   setDevices(prev => prev.map(d => d.id === "garage" ? { ...d, state: opening, detail: opening ? "Open" : "Closed", lastExplanation: expl, sensorInputs: [proxSensor, ...d.sensorInputs.slice(1)] } : d));
  //   addEvent(`Garage door ${opening ? "opened" : "closed"}`, "garage", expl);
  //
  //   // Security alert: garage opened while no one is home
  //   if (opening && homeStatus === "Away") {
  //     addNotification({ summary: "Garage door opened while away", action: "Garage door opened", reason: "Unexpected — no one is home", trigger: "Garage door sensor", explanation: expl });
  //   }
  // }, [devices, addEvent, addNotification, homeStatus, saveSnapshot]);
  //
  // // ==========================================================================
  // // SIMULATE ARRIVING HOME
  // // Sets status to "Home" and runs a welcome sequence:
  // //   - Turns on lights
  // //   - Unlocks front door
  // //   - Sets thermostat to 72°F
  // // ==========================================================================
  // const simulateArrive = useCallback(() => {
  //   saveSnapshot();
  //   setHomeStatus("Home");
  //   const geoSensor = makeSensor("geofence", "Geofence", "inside", "");
  //
  //   // Causal graph: geofence -> welcome rule -> lights ON, door unlock, thermostat 72
  //   const expl = makeExplanation(
  //       "Welcome home sequence activated because geofence detected user within home radius.",
  //       [geoSensor],
  //       [
  //         { id: "geo", label: "Geofence: Inside", type: "sensor", value: "inside" },
  //         { id: "rule", label: "Welcome Home Rule", type: "rule" },
  //         { id: "lights", label: "Lights: ON", type: "action" },
  //         { id: "lock", label: "Door: Unlock", type: "action" },
  //         { id: "thermo", label: "Thermostat: 72°F", type: "action" },
  //       ],
  //       [{ from: "geo", to: "rule" }, { from: "rule", to: "lights" }, { from: "rule", to: "lock" }, { from: "rule", to: "thermo" }],
  //       { confidence: 0.94, confidenceLabel: "High", suggestedFix: "Customize welcome scene in 'Arrival Settings'." }
  //   );
  //
  //   setDevices(prev => prev.map(d => {
  //     if (d.id === "lights") return { ...d, state: true, detail: "Warm White", lastExplanation: expl };
  //     if (d.id === "thermostat") return { ...d, detail: "72°F", extra: { temp: 72, mode: "Normal" }, lastExplanation: expl };
  //     if (d.id === "lock") return { ...d, state: false, detail: "Unlocked", lastExplanation: expl };
  //     return d;
  //   }));
  //   setTemperature(72);
  //
  //   addEvent("User arrived home", undefined, expl);
  //   addEvent("Lights turned ON — welcome mode", "lights", expl);
  //   addEvent("Front door unlocked", "lock");
  //   addEvent("Thermostat set to 72°F", "thermostat");
  //   addNotification({ summary: "Welcome home sequence activated", action: "Lights on, door unlocked, thermostat adjusted", reason: "User arrived home", trigger: "Geofence / manual trigger", explanation: expl });
  // }, [addEvent, addNotification, saveSnapshot]);
  //
  // // ==========================================================================
  // // SIMULATE "WHAT IF" QUERY
  // // Lets the user ask counterfactual questions about a device's last decision.
  // // e.g., "What if the temperature had been 80 instead of 72?"
  // // Uses the counterfactual data stored in the device's lastExplanation.
  // // ==========================================================================
  // const simulateWhatIf = useCallback((deviceId: string, variable: string, newValue: number): string => {
  //   const device = devices.find(d => d.id === deviceId);
  //   if (!device?.lastExplanation?.counterfactual) return "No counterfactual data available for this device.";
  //   const cf = device.lastExplanation.counterfactual;
  //
  //   if (variable === cf.variable) {
  //     // Check if the new value is closer to the alternative or the original
  //     if (Math.abs(newValue - cf.alternativeValue) < Math.abs(newValue - cf.currentValue)) {
  //       return `With ${variable} = ${newValue}: ${cf.wouldFire ? "Action WOULD fire." : "Action would NOT fire."} ${cf.description}`;
  //     }
  //     return `With ${variable} = ${newValue}: Original action would still ${cf.wouldFire ? "not fire" : "fire"} as the value is closer to the original.`;
  //   }
  //   return `Simulation for ${variable} = ${newValue}: Behavior unchanged — this variable doesn't affect the current decision.`;
  // }, [devices]);
  //
  // // ==========================================================================
  // // RESTORE SNAPSHOT (time-travel)
  // // Reverts the device states back to a previously saved snapshot.
  // // ==========================================================================
  // const restoreSnapshot = useCallback((index: number) => {
  //   if (index < 0 || index >= replayHistory.length) return;
  //   setDevices(replayHistory[index].snapshot);
  //   addEvent(`Restored snapshot from ${replayHistory[index].time}`);
  // }, [replayHistory, addEvent]);

  // ==========================================================================
  // RETURN VALUE
  // Everything returned here is available to any component that calls
  // useSmartHome(). This is the public API of the hook.
  //
  // Components use it like:
  //   const { devices, toggleDevice, simulateMotion } = useSmartHome();
  // ==========================================================================
  return {
    homeStatus, temperature,  lastUpdate,
    devices, events, notifications, trustScore, replayHistory,
    toggleDevice, setNotificationPriority

    // simulateLeaving, simulateMotion, simulateTempChange, simulateGarage, simulateArrive,
    // simulateWhatIf, restoreSnapshot,
    // setAutomationActive, automationActive,
  };
}