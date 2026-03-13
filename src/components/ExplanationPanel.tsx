import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { X, HelpCircle, GitBranch, AlertTriangle, Cpu, Wrench } from "lucide-react";
import type { Explanation } from "@/hooks/useSmartHome";

interface Props {
  explanation: Explanation;
  deviceName: string;
  onClose: () => void;
  onWhatIf?: (variable: string, value: number) => string;
}

function CausalGraph({ explanation }: { explanation: Explanation }) {
  const { nodes, edges } = explanation.causalGraph;
  const [expanded, setExpanded] = useState<string | null>(null);

  const typeColors: Record<string, string> = {
    sensor: "border-primary bg-primary/10 text-primary",
    rule: "border-warning bg-warning/10 text-warning",
    ai_model: "border-accent bg-accent/10 text-accent",
    action: "border-success bg-success/10 text-success",
  };

  const typeIcons: Record<string, string> = {
    sensor: "📡",
    rule: "⚙️",
    ai_model: "🧠",
    action: "⚡",
  };

  const layers = {
    sensor: nodes.filter(n => n.type === "sensor"),
    rule: nodes.filter(n => n.type === "rule" || n.type === "ai_model"),
    action: nodes.filter(n => n.type === "action"),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <GitBranch size={12} /> <span>Click nodes to expand details</span>
      </div>
      <div className="flex flex-col gap-2">
        {(["sensor", "rule", "action"] as const).map(layer => (
          <div key={layer} className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-14 shrink-0">
              {layer === "rule" ? "Logic" : layer}
            </span>
            {layers[layer].map(node => (
              <button
                key={node.id}
                onClick={() => setExpanded(expanded === node.id ? null : node.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${typeColors[node.type]} ${expanded === node.id ? "ring-1 ring-ring" : ""}`}
              >
                {typeIcons[node.type]} {node.label}
              </button>
            ))}
            {layer !== "action" && (
              <span className="text-muted-foreground text-lg">→</span>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {expanded && (() => {
          const node = nodes.find(n => n.id === expanded);
          if (!node) return null;
          const outEdges = edges.filter(e => e.from === expanded);
          const inEdges = edges.filter(e => e.to === expanded);
          return (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1"
            >
              <p className="font-medium text-foreground">{node.label}</p>
              <p className="text-muted-foreground">Type: {node.type} {node.value && `• Value: ${node.value}`}</p>
              {inEdges.length > 0 && <p className="text-muted-foreground">Inputs: {inEdges.map(e => nodes.find(n => n.id === e.from)?.label).join(", ")}</p>}
              {outEdges.length > 0 && <p className="text-muted-foreground">Outputs: {outEdges.map(e => nodes.find(n => n.id === e.to)?.label).join(", ")}</p>}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export default function ExplanationPanel({ explanation, deviceName, onClose, onWhatIf }: Props) {
  const [sliderValue, setSliderValue] = useState<number>(
    explanation.counterfactual?.currentValue ?? 50
  );
  const [whatIfResult, setWhatIfResult] = useState<string>("");

  const handleSlider = useCallback((val: number[]) => {
    const v = val[0];
    setSliderValue(v);
    if (onWhatIf && explanation.counterfactual) {
      setWhatIfResult(onWhatIf(explanation.counterfactual.variable, v));
    }
  }, [onWhatIf, explanation.counterfactual]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="glass-card p-5 border-primary/30"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-primary" size={18} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Explanation: {deviceName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                explanation.confidence > 0.9 ? "bg-success/10 text-success" : explanation.confidence > 0.7 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
              }`}>
                {Math.round(explanation.confidence * 100)}% confident • {explanation.confidenceLabel}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary transition-colors">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      <Tabs defaultValue="why" className="w-full">
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="why" className="flex-1 text-xs">Why</TabsTrigger>
          <TabsTrigger value="whynot" className="flex-1 text-xs">Why Not</TabsTrigger>
          <TabsTrigger value="whatif" className="flex-1 text-xs">What-If</TabsTrigger>
          <TabsTrigger value="provenance" className="flex-1 text-xs">Provenance</TabsTrigger>
        </TabsList>

        <TabsContent value="why" className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{explanation.why}</p>
          <div className="border-t border-border/50 pt-3">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Causal Graph</h4>
            <CausalGraph explanation={explanation} />
          </div>
          {explanation.suggestedFix && (
            <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <Wrench size={14} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{explanation.suggestedFix}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="whynot" className="space-y-3">
          {explanation.whyNot ? (
            <>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{explanation.whyNot}</p>
              </div>
              {explanation.counterfactual && (
                <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Counterfactual</p>
                  <p className="text-xs text-foreground">{explanation.counterfactual.description}</p>
                  <div className="flex gap-4 mt-2 text-xs font-mono">
                    <span className="text-muted-foreground">Current: <span className="text-foreground">{explanation.counterfactual.currentValue}</span></span>
                    <span className="text-muted-foreground">Alternative: <span className="text-primary">{explanation.counterfactual.alternativeValue}</span></span>
                    <span className="text-muted-foreground">Would fire: <span className={explanation.counterfactual.wouldFire ? "text-success" : "text-destructive"}>{explanation.counterfactual.wouldFire ? "Yes" : "No"}</span></span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No counterfactual explanation available for this action.</p>
          )}
        </TabsContent>

        <TabsContent value="whatif" className="space-y-4">
          {explanation.counterfactual ? (
            <>
              <p className="text-sm text-foreground">{explanation.whatIf || "Adjust the slider to simulate different sensor values."}</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">{explanation.counterfactual.variable}</span>
                  <span className="text-foreground font-mono font-bold">{sliderValue.toFixed(1)}</span>
                </div>
                <Slider
                  min={Math.min(explanation.counterfactual.currentValue, explanation.counterfactual.alternativeValue) * 0.5}
                  max={Math.max(explanation.counterfactual.currentValue, explanation.counterfactual.alternativeValue) * 1.5 || 1}
                  step={0.1}
                  value={[sliderValue]}
                  onValueChange={handleSlider}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Current: {explanation.counterfactual.currentValue}</span>
                  <span>Alt: {explanation.counterfactual.alternativeValue}</span>
                </div>
              </div>
              {whatIfResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-accent/10 border border-accent/20 rounded-lg p-3"
                >
                  <p className="text-xs text-foreground">{whatIfResult}</p>
                </motion.div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No simulation data available for this device.</p>
          )}
        </TabsContent>

        <TabsContent value="provenance" className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={14} className="text-primary" />
            <h4 className="text-xs font-semibold text-foreground">Data Sources & Timestamps</h4>
          </div>
          <div className="space-y-2">
            {explanation.provenance.sources.map((s, i) => (
              <div key={i} className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-foreground">{s.name}</span>
                  <span className="text-muted-foreground font-mono">{s.timestamp}</span>
                </div>
                <div className="flex gap-4 text-muted-foreground">
                  <span>ID: <span className="text-foreground">{s.sensorId}</span></span>
                  <span>Value: <span className="text-primary">{s.value}{s.unit ? ` ${s.unit}` : ""}</span></span>
                  {s.signalStrength && <span>Signal: <span className={s.signalStrength > 90 ? "text-success" : "text-warning"}>{s.signalStrength}%</span></span>}
                  {s.firmware && <span>FW: <span className="text-foreground">{s.firmware}</span></span>}
                </div>
              </div>
            ))}
          </div>
          {explanation.provenance.ruleName && (
            <div className="border-t border-border/50 pt-2">
              <p className="text-xs text-muted-foreground">Rule: <span className="text-foreground">{explanation.provenance.ruleName}</span></p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
