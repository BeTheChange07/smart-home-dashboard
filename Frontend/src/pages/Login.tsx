import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const isAdmin = username.toLowerCase() === "admin";

  const handleLogin = () => {
    if (username.trim() !== "") {
      onLogin(username);
      navigate(isAdmin ? "/admin" : "/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-gradient-to-br from-background to-muted px-4">
      
      <div className="glass-card p-8 w-full max-w-sm shadow-lg border border-border">
        
        {/* Icon + Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 rounded-xl bg-primary/10 mb-3">
            <LayoutDashboard className="text-primary" size={28} />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            Smart Home
          </h1>

          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Admin Login" : "Control Center Login"}
          </p>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2.5 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
        />

        {/* Button */}
        <button
          onClick={handleLogin}
          className={`w-full py-2.5 rounded-md font-medium transition shadow-[var(--glow-primary)] ${
            isAdmin
              ? "bg-red-500 text-white hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {isAdmin ? "Login as Admin" : "Login"}
        </button>
      </div>
    </div>
  );
}