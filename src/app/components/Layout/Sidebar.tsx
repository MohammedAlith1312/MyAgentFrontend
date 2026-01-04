"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

import { usePathname, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  History,
  Wrench,
  Send,
  BarChart3,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Mail,
} from "lucide-react";
import { Badge } from "../../components/UI/Badge";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversationId');
  const [agentModel, setAgentModel] = useState<string>("Loading...");

  const navItems = useMemo(() => {
    const items = [
      {
        href: "/chat",
        icon: MessageSquarePlus,
        label: "New Chat",
        badge: null
      },
      // Only show "Current Chat" if we are in an active conversation
      ...(conversationId ? [{
        href: `/chat?conversationId=${conversationId}`,
        icon: MessageSquare,
        label: "Current Chat",
        badge: "active"
      }] : []),
      { href: "/history", icon: History, label: "History", badge: null },
      { href: "/tools", icon: Wrench, label: "Tools", badge: null },
      {
        href: "/evaluations",
        icon: BarChart3,
        label: "RealTime Performance",
        badge: "Live",
      },
      { href: "/send", icon: Mail, label: "Email", badge: null },
    ];
    return items;
  }, [conversationId]);

  useEffect(() => {
    // ... same effect
    const timer = setTimeout(() => {
      setAgentModel("Gemini 2.0 Flash");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  const [isCollapsed, setIsCollapsed] = useState(false);

  // ... (useEffect remains same) ...

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-64"} bg-gray-50 border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="font-bold text-lg text-white">A</span>
              </div>
            </div>
            <div className="animate-in fade-in duration-300">
              <h1 className="text-base font-bold text-gray-900 leading-tight">AI Chat</h1>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Console</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors ${isCollapsed ? "mx-auto" : ""}`}
          title={isCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* <div className="px-3 mb-4">
        <Link
          href="/chat"
          className={`flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-md shadow-blue-200 transition-all active:scale-[0.98] group ${isCollapsed ? "px-0" : "px-4"}`}
          title="New Chat"
        >
          <MessageSquarePlus className="w-5 h-5 group-hover:rotate-0 transition-transform duration-300" />
          {!isCollapsed && <span className="font-semibold animate-in fade-in duration-200">New Chat</span>}
        </Link>
      </div> */}

      <nav className="px-3 space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            title={isCollapsed ? item.label : ""}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${pathname === item.href
              ? "bg-blue-50 text-blue-600"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              } ${isCollapsed ? "justify-center" : ""}`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 truncate animate-in fade-in duration-200">{item.label}</span>
                {item.badge && (
                  <Badge variant={item.badge === "Live" ? "success" : "secondary"} size="sm" className={item.badge === "Live" ? "animate-pulse" : ""}>
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
            {item.badge === "active" && isCollapsed && (
              <div className="absolute right-2 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-white border border-gray-100 shadow-sm ${isCollapsed ? "justify-center" : ""}`}>
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm">
              G
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-in fade-in duration-200">
              <p className="text-sm font-bold text-gray-900 truncate">Sample-User</p>
              <p className="text-xs text-gray-500 font-medium truncate">{agentModel}</p>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}