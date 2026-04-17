import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import OverviewView from './components/OverviewView';
import TagFleetView from './components/TagFleetView';
import ProductsView from './components/ProductsView';
import MockMobileScanner from './components/MockMobileScanner';
import { 
  Bell, 
  Search, 
  Smartphone, 
  User, 
  HelpCircle,
  Menu
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const renderView = () => {
    switch (activeTab) {
      case 'overview': return <OverviewView />;
      case 'tags': return <TagFleetView />;
      case 'products': return <ProductsView />;
      default: return <OverviewView />;
    }
  };

  return (
    <div className="flex min-h-screen font-sans selection:bg-sky-500 selection:text-white">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative z-0">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-slate-950/60 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-4 text-slate-400">
              <Menu className="w-5 h-5 lg:hidden" />
              <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em]">
                 <span className="text-slate-500">Infrastructure</span>
                 <span className="text-white/20">/</span>
                 <span className="text-sky-400">{activeTab}</span>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <div className="relative hidden lg:block">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                 <input 
                    type="text" 
                    placeholder="Search Node IDs..." 
                    className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-xs text-slate-300 w-64 focus:outline-none focus:ring-1 focus:ring-sky-500/50 mt-0"
                 />
              </div>

              <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                 <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="p-2 text-slate-400 hover:text-sky-400 transition-colors relative group"
                 >
                    <Smartphone className="w-5 h-5" />
                 </button>
                 <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-sky-500 rounded-full" />
                 </button>
                 <div className="flex items-center gap-3 ml-2">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-bold text-slate-200">s.roberts@retail.io</p>
                       <p className="text-[9px] text-slate-500 uppercase tracking-widest">Network Admin</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                       SR
                    </div>
                 </div>
              </div>
           </div>
        </header>

        {/* View Container */}
        <div className="p-8 pb-20 max-w-7xl mx-auto w-full">
          {renderView()}
        </div>
      </main>

      {/* Mobile Experience Demo overlay */}
      {isScannerOpen && <MockMobileScanner onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
}

