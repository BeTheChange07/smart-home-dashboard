import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import type { EventLog } from "@/hooks/useSmartHome";

interface Props {
  events: EventLog[];
}

export default function EventLogPanel({ events }: Props) {
  return (
    <div className="glass-card p-5 flex flex-col h-full">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Event Log</h3>
      <ScrollArea className="flex-1 max-h-[360px]">
        <AnimatePresence initial={false}>
          {events.map(e => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 py-2 border-b border-border/50 last:border-0"
            >
              <span className="text-[11px] font-mono text-muted-foreground shrink-0 pt-0.5">{e.time}</span>
              <span className="text-sm text-foreground">{e.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
