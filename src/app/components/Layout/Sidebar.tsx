"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

import { usePathname } from "next/navigation";
import {
  MessageSquare,
  History,
  Mail,
  Shield,
  Wrench,
  Send,
  BarChart3,
} from "lucide-react";
import { Badge } from "../../components/UI/Badge";

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat", badge: "live" },
  { href: "/history", icon: History, label: "History", badge: null },

  { href: "/tools", icon: Wrench, label: "Tools", badge: null },
  {
    href: "/evaluations",
    icon: BarChart3,
    label: "RealTime Performance",
    badge: "Live",
  },
  { href: "/send", icon: Send, label: "Send Email", badge: null },
];


export function Sidebar() {
  const pathname = usePathname();
  const [agentModel, setAgentModel] = useState<string>("Loading...");

  useEffect(() => {
    // In a real app, this would be:
    // apiClient.getAgentInfo().then(info => setAgentModel(info.model));
    // For now, we simulate the backend response with a realistic delay
    const timer = setTimeout(() => {
      setAgentModel("Gemini 2.0 Flash");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="font-bold text-xl text-white">A</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">AI Chat Assistant</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Management Console</p>
          </div>
        </div>
      </div>


      <nav className="px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === item.href
              ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant={item.badge === "Live" ? "success" : "secondary"} size="sm" className={item.badge === "Live" ? "animate-pulse" : ""}>
                {item.badge}
              </Badge>
            )}

          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-gray-100 shadow-sm">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm">
              G
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-md font-bold text-gray-900 truncate">Sample-User</p>
            <p className="text-sm text-gray-500 font-medium">{agentModel}</p>
          </div>

          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </div>
      </div>

    </aside>
  );
}