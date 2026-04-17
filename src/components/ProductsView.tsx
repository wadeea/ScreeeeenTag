import React, { useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function ProductsView() {
  const { products, fetchData, isLoading } = useStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Catalog</h2>
          <p className="text-slate-400 text-sm">Asset registry and pricing nodes</p>
        </div>
        <button className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-sky-500/20">
          <Plus className="w-4 h-4" />
          Register Product
        </button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/5 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search SKUs, names, or nodes..." 
              className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500/50 mt-0"
            />
          </div>
          <button className="bg-white/5 hover:bg-white/10 text-slate-400 px-4 py-2 rounded-lg text-sm transition-colors border border-white/10 mt-0">
            Advanced Filter
          </button>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-slate-900/50">
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">SKU</th>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Product Name</th>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Pricing</th>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Class</th>
              <th className="p-4 text-[10px] font-bold uppercase text-slate-500 tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {isLoading && products.length === 0 ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="p-12 text-center bg-white/5">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-slate-500" />
                  </td>
                </tr>
              ))
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 text-sky-400 text-xs font-bold tracking-tighter">{product.sku}</td>
                <td className="p-4 font-sans font-medium text-slate-200 text-sm">{product.name}</td>
                <td className="p-4 text-slate-100 font-bold text-sm">
                  {product.currency} {product.price.toFixed(2)}
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 bg-slate-800/50 text-slate-400 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest">
                    {product.category}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button className="p-1.5 text-slate-600 hover:text-sky-400 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
