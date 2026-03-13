import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Bell } from "lucide-react";
import type { Notification } from "@/hooks/useSmartHome";

interface Props {
  notifications: Notification[];
}

function NotifCard({ n }: { n: Notification }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/50 rounded-lg overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-primary shrink-0" />
          <span className="text-sm text-foreground">{n.summary}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground">{n.time}</span>
          {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1.5 bg-secondary/30">
              <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Action</span><p className="text-sm text-foreground">{n.action}</p></div>
              <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Reason</span><p className="text-sm text-foreground">{n.reason}</p></div>
              <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Trigger</span><p className="text-sm text-primary">{n.trigger}</p></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function NotificationPanel({ notifications }: Props) {
  return (
    <div className="glass-card p-5 flex flex-col h-full">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Automation Notifications
        {notifications.length > 0 && (
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
            {notifications.length}
          </span>
        )}
      </h3>
      <ScrollArea className="flex-1 max-h-[360px]">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => <NotifCard key={n.id} n={n} />)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
