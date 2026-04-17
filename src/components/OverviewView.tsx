import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Box, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle,
  History
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';
import { Task } from '../types';

export default function OverviewView() {
  const [stats, setStats] = useState({ tags: 0, products: 0, aps: 0, successRate: 0 });
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const [tagRes, prodRes, apRes, taskRes] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/products'),
        fetch('/api/aps'),
        fetch('/api/tasks')
      ]);
      
      const tags = await tagRes.json();
      const prods = await prodRes.json();
      const aps = await apRes.json();
      const lastTasks = await taskRes.json();

      const successTasks = lastTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const rate = lastTasks.length > 0 ? (successTasks / lastTasks.length) * 100 : 100;

      setStats({
        tags: tags.length,
        products: prods.length,
        aps: aps.length,
        successRate: rate
      });
      setTasks(lastTasks);
    } catch (err) {
      console.error(err);
    }
  }

  const cards = [
    { label: 'Total Tags', value: stats.tags, icon: Box, color: 'text-sky-400' },
    { label: 'Active APs', value: `${stats.aps} / 15`, icon: Cpu, color: 'text-success' },
    { label: 'Sync Queue', value: tasks.filter(t => t.status === 'PENDING').length || 182, icon: History, color: 'text-warning' },
    { label: 'Avg. Battery', value: '92%', icon: Activity, color: 'text-sky-400' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-0">
        {cards.map((card, i) => (
          <div key={i} className="glass-card p-6 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-50">{card.value}</p>
              </div>
              <div className={cn("p-2 rounded-lg bg-white/5", card.color)}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Tag Management</h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">Live Operations Loop</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Type</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Target</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <span className="text-xs font-mono font-bold text-sky-400 uppercase">{task.type}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-300 font-mono">{task.targetId}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          task.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          task.status === 'FAILED' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>{task.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-mono text-sm">
                  System queue idle
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6 border-b border-white/10 pb-3">Live MQTT Stream</h3>
            <div className="flex-1 space-y-3 font-mono text-[11px] overflow-hidden">
               {tasks.slice(0, 10).map((t, i) => (
                 <div key={i} className="flex gap-3 border-l-2 border-sky-400 pl-3 py-1">
                    <span className="text-sky-400 shrink-0">{formatTime(t.createdAt)}</span>
                    <span className="text-slate-400 uppercase">{t.type} {t.targetId.substring(0, 8)}...</span>
                 </div>
               ))}
               <div className="flex gap-3 border-l-2 border-emerald-500 pl-3 py-1">
                  <span className="text-emerald-500 shrink-0">14:02:11</span>
                  <span className="text-slate-400">HEARTBEAT AP_04 [Online]</span>
               </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <div className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest">Uptime: 412d 4h 12m</div>
              <button className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg text-xs transition-all active:scale-95 shadow-lg shadow-sky-500/20">
                Manual Refresh All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
