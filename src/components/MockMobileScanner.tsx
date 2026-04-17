import React, { useState } from 'react';
import { 
  Maximize2, 
  Smartphone, 
  Search, 
  Camera, 
  Barcode, 
  Link2,
  ChevronRight,
  ArrowRight,
  Database,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function MockMobileScanner({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1); // 1: Scan Product, 2: Scan Tag, 3: Success
  const [scannedSku, setScannedSku] = useState('');
  const [scannedTag, setScannedTag] = useState('');

  const handleScanProduct = () => {
    setScannedSku('SKU001');
    setStep(2);
  };

  const handleScanTag = async () => {
    setScannedTag('TAG-HEX-002');
    // Execute bind sync
    try {
      await fetch('/api/tags/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: 'TAG-HEX-002', sku: 'SKU001' })
      });
      setStep(3);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-[320px] aspect-[9/19.5] bg-slate-900 border-[8px] border-slate-950 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col ring-1 ring-white/10">
        
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-10" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col custom-scrollbar">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-slate-100 font-bold text-lg tracking-tight">Nexus Mobile</h3>
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-100 transition-colors"><Maximize2 className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
            {step === 1 && (
              <>
                <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center text-sky-400 animate-pulse border border-sky-500/20">
                  <Barcode className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-slate-100 font-bold mb-2">Scan Product</h4>
                  <p className="text-slate-400 text-xs">Point camera at node barcode or shelf SKU</p>
                </div>
                <button 
                  onClick={handleScanProduct}
                  className="w-full bg-sky-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all active:scale-95 shadow-lg shadow-sky-500/20"
                >
                  <Camera className="w-5 h-5" />
                  Trigger Scanner
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="w-full bg-white/5 p-4 rounded-xl border border-dashed border-white/10 mb-4">
                   <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Product Context</p>
                   <p className="text-sm font-bold text-slate-100 truncate">Premium Espresso Beans</p>
                   <p className="text-xs text-sky-400 font-mono mt-0.5">{scannedSku}</p>
                </div>
                <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center text-slate-950 animate-pulse shadow-xl shadow-sky-500/40">
                  <Link2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-slate-100 font-bold mb-2">Target Node</h4>
                  <p className="text-slate-400 text-xs">Scan the QR code on the target ESL Tag</p>
                </div>
                <button 
                  onClick={handleScanTag}
                  className="w-full bg-slate-100 text-slate-950 py-4 rounded-2xl font-bold transition-all active:scale-95"
                >
                  Confirm Link
                </button>
              </>
            )}

            {step === 3 && (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-slate-100 font-bold mb-2">Nexus Sync Active</h4>
                <p className="text-slate-400 text-xs mb-8">Mesh update dispatched via Cloud AP.</p>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full bg-white/5 text-slate-200 py-4 rounded-2xl font-bold transition-all active:scale-95 border border-white/10"
                >
                  Reset Sequence
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="h-16 p-4 flex justify-around opacity-30 border-t border-white/5">
           <Smartphone className="w-5 h-5 text-slate-400" />
           <Database className="w-5 h-5 text-slate-400" />
           <ArrowRight className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
