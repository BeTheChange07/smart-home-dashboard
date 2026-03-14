import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface Props {
  score: number;
  rationale: string;
}

export default function TrustSummary({ score, rationale }: Props) {
  const color = score >= 90 ? "text-success" : score >= 70 ? "text-warning" : "text-destructive";
  const strokeColor = score >= 90 ? "stroke-success" : score >= 70 ? "stroke-warning" : "stroke-destructive";
  const pct = score / 100;

  return (
    <div className="glass-card p-5 flex items-center gap-5">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-secondary" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none" strokeWidth="8"
            strokeLinecap="round"
            className={strokeColor}
            initial={{ strokeDasharray: "0 264" }}
            animate={{ strokeDasharray: `${pct * 264} 264` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold font-mono ${color}`}>
          {score}%
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className={color} size={16} />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">System Confidence</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{rationale}</p>
      </div>
    </div>
  );
}
