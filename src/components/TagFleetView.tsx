import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Battery, 
  Link2, 
  Link2Off,
  MoreVertical,
  ChevronRight,
  Database,
  RefreshCw,
  Search,
  Layers
} from 'lucide-react';
import { Tag, Product } from '../types';
import { cn, formatTime } from '../lib/utils';

export default function TagFleetView() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [searchSku, setSearchSku] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [tagRes, prodRes] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/products')
      ]);
      setTags(await tagRes.json());
      setProducts(await prodRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBind(tagId: string, sku: string) {
    try {
      const res = await fetch('/api/tags/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, sku })
      });
      if (res.ok) {
        setIsBinding(false);
        setSelectedTag(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const filteredProducts = products.filter(p => 
    p.sku.toLowerCase().includes(searchSku.toLowerCase()) || 
    p.name.toLowerCase().includes(searchSku.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Node Fleet</h2>
          <p className="text-slate-400 text-sm">Active ESL components in the Nexus mesh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-0">
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tags.map((tag) => (
              <div 
                key={tag.id}
                onClick={() => setSelectedTag(tag)}
                className={cn(
                  "p-4 rounded-xl transition-all cursor-pointer group relative overflow-hidden glass-card",
                  selectedTag?.id === tag.id && "bg-slate-800/80 ring-2 ring-sky-500/50"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-white/5",
                      tag.status === 'READY' ? "text-sky-400" : "text-slate-500"
                    )}>
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-slate-100 font-mono text-sm font-bold tracking-tight">{tag.tagId}</h3>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{tag.status}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-[10px] font-mono",
                        tag.battery > 50 ? "text-emerald-400" : tag.battery > 20 ? "text-amber-400" : "text-red-400"
                      )}>{tag.battery}%</span>
                      <Battery className={cn(
                        "w-3.5 h-3.5",
                        tag.battery > 50 ? "text-emerald-400" : tag.battery > 20 ? "text-amber-400" : "text-red-400"
                      )} />
                    </div>
                    <Wifi className="w-3.5 h-3.5 text-success" />
                  </div>
                </div>

                <div className="bg-black/20 rounded-lg p-3 border border-white/5 mb-0">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1">
                      {tag.sku ? (
                        <>
                          <p className="text-xs font-sans text-slate-300 line-clamp-1">{tag.productName}</p>
                          <p className="text-xs font-mono font-bold text-sky-400 mt-1">${tag.productPrice?.toFixed(2)}</p>
                        </>
                      ) : (
                        <p className="text-xs font-mono text-slate-500 italic uppercase tracking-wider text-[10px]">Unbound</p>
                      )}
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded flex items-center justify-center",
                      tag.sku ? "bg-sky-500/10 text-sky-400" : "bg-white/5 text-slate-600"
                    )}>
                      {tag.sku ? <Link2 className="w-4 h-4" /> : <Link2Off className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Panel */}
        <div className="col-span-1">
          {selectedTag ? (
            <div className="glass-card rounded-xl p-6 sticky top-24 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Nexus Provisioning</h3>
                <button onClick={() => setSelectedTag(null)} className="text-slate-500 hover:text-white transition-colors"><ChevronRight className="w-4 h-4 rotate-90" /></button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Tag ID</span>
                  <span className="text-sm text-slate-100 font-mono font-bold tracking-tight">{selectedTag.tagId}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Binding</span>
                  <span className="text-sm text-sky-400 font-mono uppercase">{selectedTag.sku || 'None'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => setIsBinding(!isBinding)}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-sky-500/20"
                >
                  <Link2 className="w-4 h-4" />
                  Apply New Template
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 text-slate-200 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10">
                  <RefreshCw className="w-4 h-4" />
                  Manual Wake
                </button>
              </div>

              {isBinding && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                  <p className="text-[10px] text-slate-400 font-bold mb-3 uppercase tracking-widest">Available Products</p>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <input 
                      type="text" 
                      placeholder="Filter SKU..."
                      value={searchSku}
                      onChange={(e) => setSearchSku(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 mt-0"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredProducts.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => handleBind(selectedTag.tagId, p.sku)}
                        className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-sky-500/50 transition-colors flex justify-between items-center group mt-0"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-200">{p.sku}</p>
                          <p className="text-[10px] text-slate-500">{p.name}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-sky-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center h-full flex flex-col items-center justify-center border-dashed border-white/20">
              <Layers className="w-12 h-12 text-white/5 mb-4" />
              <p className="text-slate-500 text-xs font-medium uppercase tracking-widest leading-relaxed">System Ready<br/>Awaiting Node Selection</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
