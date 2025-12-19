"use client";

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
  {
    href: "/guardrails",
    icon: Shield,
    label: "Guardrails",
    badge: "4 active",
  },
  { href: "/tools", icon: Wrench, label: "Tools", badge: null },
  {
    href: "/evaluations",
    icon: BarChart3,
    label: "Evaluations",
    badge: "8.5 avg",
  },
  { href: "/send", icon: Send, label: "Send Email", badge: null },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-xl text-white">V</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">VoltAgent</h1>
            <p className="text-sm text-gray-600">AI Agent Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === item.href
                ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" size="sm">
                {item.badge}
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">sample-app</p>
            <p className="text-xs text-gray-600">Active Agent</p>
          </div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    </aside>
  );
}