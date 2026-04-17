import React from 'react';
import { 
  LayoutDashboard, 
  Tags, 
  Package, 
  Layers, 
  Activity, 
  Settings,
  Cpu,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'tags', icon: Tags, label: 'ESL Tags' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'aps', icon: Cpu, label: 'Access Points' },
    { id: 'tasks', icon: Activity, label: 'System Logs' },
  ];

  return (
    <div className="w-64 bg-slate-950/40 backdrop-blur-md border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="text-slate-50 font-bold text-xl tracking-tighter">
          ESL<span className="text-sky-400">NEXUS</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
              activeTab === item.id 
                ? "bg-slate-800/70 text-slate-50 border border-white/10 shadow-lg" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4",
              activeTab === item.id ? "text-sky-400" : "text-slate-500 group-hover:text-slate-400"
            )} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-xl p-3 mb-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">MQTT CLOUD CONNECTED</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Admin: s.roberts@retail.io
          </div>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-400 text-sm font-medium transition-colors">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
