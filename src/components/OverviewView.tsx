import React, { useEffect } from 'react';
import { 
  Box, 
  Activity, 
  Cpu, 
  History
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';
import { useStore } from '../store/useStore';

export default function OverviewView() {
  const { tags, aps, tasks, fetchData, products } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeAps = aps.filter(ap => ap.status === 'ONLINE').length;
  const pendingTasks = tasks.filter(t => ['PENDING', 'SENT', 'ACK'].includes(t.status)).length;
  const successTasksCount = tasks.filter(t => t.status === 'DISPLAYED').length;
  const successRate = tasks.length > 0 ? (successTasksCount / tasks.length) * 100 : 100;

  const cards = [
    { label: 'Total Tags', value: tags.length, icon: Box, color: 'text-sky-400' },
    { label: 'Active APs', value: `${activeAps} / ${aps.length || '--'}`, icon: Cpu, color: 'text-emerald-400' },
    { label: 'Sync Queue', value: pendingTasks, icon: History, color: 'text-amber-400' },
    { label: 'System Health', value: `${successRate.toFixed(0)}%`, icon: Activity, color: 'text-sky-400' },
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
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Active Task Engine</h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-full border border-sky-500/20">Real-time Pipeline</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Operation</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Target Node</th>
                    <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-tight">{task.type}</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">{task.id.split('-')[0]}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-300 font-mono">{task.target_tag_id}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={cn(
                          "px-2 py-1 rounded text-[9px] font-bold uppercase border",
                          task.status === 'DISPLAYED' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          task.status === 'FAILED' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          task.status === 'SENT' ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                          task.status === 'ACK' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>{task.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tasks.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center justify-center space-y-3 opacity-40">
                  <History className="w-8 h-8 text-slate-500" />
                  <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Job Processor Idle</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-6 h-full flex flex-col">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-6 border-b border-white/10 pb-3">Audit Logs</h3>
            <div className="flex-1 space-y-4 font-mono text-[11px] overflow-hidden">
               {tasks.slice(0, 8).map((t, i) => (
                 <div key={i} className="flex gap-4 group">
                    <span className="text-slate-500 shrink-0 tabular-nums">{formatTime(t.created_at)}</span>
                    <div className="flex-1 border-l border-white/10 pl-4 pb-4">
                      <p className="text-slate-300 uppercase font-bold tracking-tight">{t.type}</p>
                      <p className="text-slate-500 mt-1">Node: {t.target_tag_id.slice(0,10)}...</p>
                      <p className={cn(
                        "mt-1 uppercase text-[9px]",
                        t.status === 'DISPLAYED' ? "text-emerald-500" : "text-sky-500"
                      )}>{t.status}</p>
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/10">
              <button 
                onClick={() => fetchData()}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-200 font-bold rounded-lg text-xs transition-all active:scale-95 border border-white/10"
              >
                Force Global Sync
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
