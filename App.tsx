import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List as ListIcon, Calendar as CalendarIcon, ScanLine, Bell, Filter } from 'lucide-react';
import Scanner from './components/Scanner';
import ProductForm from './components/ProductForm';
import { analyzeProductImage } from './services/geminiService';
import { Product, CalendarEvent, ViewState, ScanResult } from './types';

// --- Helper Components defined here for simplicity in file structure ---

const Dashboard = ({ products, onScan }: { products: Product[], onScan: () => void }) => {
  const today = new Date();
  today.setHours(0,0,0,0);

  const expiringSoon = products.filter(p => {
    if (!p.data_scadenza) return false;
    const d = new Date(p.data_scadenza);
    const diffTime = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 0 && diffDays <= 3;
  });

  const expired = products.filter(p => {
    if (!p.data_scadenza) return false;
    const d = new Date(p.data_scadenza);
    d.setHours(0,0,0,0);
    return d < today;
  });

  return (
    <div className="space-y-6 pb-20 p-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <h1 className="text-2xl font-bold mb-2">MyProd Tracker</h1>
        <p className="text-blue-100 mb-6">Tieni traccia delle scadenze in modo intelligente.</p>
        
        <button 
          onClick={onScan}
          className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-50 transition-colors"
        >
          <ScanLine size={24} />
          SCANSIONA PRODOTTO
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-2 text-orange-600">
             <Bell size={18} />
             <span className="font-semibold text-sm">In Scadenza</span>
           </div>
           <p className="text-3xl font-bold text-gray-800">{expiringSoon.length}</p>
           <p className="text-xs text-gray-500">Entro 3 giorni</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-2 text-red-600">
             <Filter size={18} />
             <span className="font-semibold text-sm">Scaduti</span>
           </div>
           <p className="text-3xl font-bold text-gray-800">{expired.length}</p>
           <p className="text-xs text-gray-500">Attenzione</p>
        </div>
      </div>

      {/* Recent List */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Prodotti Recenti</h3>
        <div className="space-y-3">
          {products.slice(0, 5).map(p => (
            <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
               <div>
                 <p className="font-medium text-gray-900">{p.nome_prodotto}</p>
                 <p className="text-xs text-gray-500">{p.data_scadenza ? `Scad: ${p.data_scadenza}` : 'Nessuna scadenza'}</p>
               </div>
               <div className={`w-2 h-2 rounded-full ${
                  !p.data_scadenza ? 'bg-gray-300' :
                  new Date(p.data_scadenza) < today ? 'bg-red-500' :
                  new Date(p.data_scadenza) <= new Date(today.getTime() + 3*86400000) ? 'bg-orange-400' : 'bg-green-500'
               }`}></div>
            </div>
          ))}
          {products.length === 0 && (
             <p className="text-center text-gray-400 text-sm py-4">Nessun prodotto tracciato.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const ProductList = ({ products, onEdit }: { products: Product[], onEdit: (p: Product) => void }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = a.data_scadenza ? new Date(a.data_scadenza).getTime() : 9999999999999;
      const dateB = b.data_scadenza ? new Date(b.data_scadenza).getTime() : 9999999999999;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [products, sortOrder]);

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div className="pb-20 p-4 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">I tuoi Prodotti</h2>
        <button 
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
        >
          <Filter size={16} />
          {sortOrder === 'asc' ? 'Scadenza (vicina)' : 'Scadenza (lontana)'}
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map(p => {
          const expiryDate = p.data_scadenza ? new Date(p.data_scadenza) : null;
          let statusColor = 'border-l-gray-300';
          let bgColor = 'bg-white';
          
          if (expiryDate) {
            if (expiryDate < today) {
              statusColor = 'border-l-red-500';
              bgColor = 'bg-red-50';
            } else {
               const diffTime = expiryDate.getTime() - today.getTime();
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
               if (diffDays <= 3) {
                 statusColor = 'border-l-orange-400';
                 bgColor = 'bg-orange-50';
               } else {
                 statusColor = 'border-l-green-500';
               }
            }
          }

          return (
            <div 
              key={p.id} 
              onClick={() => onEdit(p)}
              className={`relative p-4 rounded-lg shadow-sm border border-gray-200 border-l-4 ${statusColor} ${bgColor} active:scale-[0.99] transition-transform`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{p.nome_prodotto}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">{p.codice_ean_qr || 'No Code'}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-semibold text-gray-700">
                     {p.data_scadenza ? new Date(p.data_scadenza).toLocaleDateString() : '--/--/----'}
                   </p>
                   <span className="text-[10px] text-gray-400">Scadenza</span>
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p className="text-center text-gray-500 mt-10">Nessun prodotto.</p>}
      </div>
    </div>
  );
}

const CalendarView = ({ events, onEventClick }: { events: CalendarEvent[], onEventClick: (productId: string) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  // Adjust so Monday is 0
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  return (
    <div className="pb-20 p-4">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-gray-800">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
         <div className="flex gap-2">
           <button onClick={handlePrevMonth} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">{'<'}</button>
           <button onClick={handleNextMonth} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">{'>'}</button>
         </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-semibold text-gray-400">
        <div>Lun</div><div>Mar</div><div>Mer</div><div>Gio</div><div>Ven</div><div>Sab</div><div>Dom</div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 bg-transparent"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.data_scadenza === dateStr);
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

          return (
            <div key={day} className={`h-24 border border-gray-100 rounded-lg p-1 overflow-y-auto no-scrollbar ${isToday ? 'bg-blue-50 ring-1 ring-blue-300' : 'bg-white'}`}>
              <div className="text-xs font-medium text-gray-500 mb-1">{day}</div>
              <div className="flex flex-col gap-1">
                {dayEvents.map(ev => (
                  <div 
                    key={ev.id_evento} 
                    onClick={() => onEventClick(ev.prodotto_ref)}
                    className="bg-red-100 text-red-800 text-[9px] p-1 rounded leading-tight cursor-pointer truncate"
                  >
                    {ev.nome_prodotto}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  
  // State for Scanner/Form
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Load from local storage
  useEffect(() => {
    const savedProds = localStorage.getItem('myprod_products');
    const savedEvents = localStorage.getItem('myprod_events');
    if (savedProds) setProducts(JSON.parse(savedProds));
    if (savedEvents) setCalendarEvents(JSON.parse(savedEvents));
  }, []);

  // Save to local storage whenever changed
  useEffect(() => {
    localStorage.setItem('myprod_products', JSON.stringify(products));
    localStorage.setItem('myprod_events', JSON.stringify(calendarEvents));
  }, [products, calendarEvents]);

  // AUTOMATION 1: Sync Calendar
  const syncCalendar = (newProducts: Product[]) => {
    const newEvents = newProducts
      .filter(p => p.data_scadenza) // Only create event if date exists
      .map(p => ({
        id_evento: p.id, // Simple 1:1 mapping for this demo, could be unique UUID
        prodotto_ref: p.id,
        nome_prodotto: p.nome_prodotto,
        data_scadenza: p.data_scadenza!,
        note: 'Scadenza prodotto'
      }));
    setCalendarEvents(newEvents);
  };

  const handleScan = async (imageData: string) => {
    setIsProcessing(true);
    const result = await analyzeProductImage(imageData);
    setIsProcessing(false);
    setIsScanning(false);
    
    if (result.data_scadenza && result.nome_prodotto) {
      // Auto-save path
      const newProduct: Product = {
        id: crypto.randomUUID(),
        nome_prodotto: result.nome_prodotto,
        codice_ean_qr: result.codice_ean_qr,
        data_scadenza: result.data_scadenza,
        scansionato_il: new Date().toISOString()
      };
      
      const updatedProducts = [newProduct, ...products];
      setProducts(updatedProducts);
      syncCalendar(updatedProducts);
      
      // Feedback
      alert(`Prodotto aggiunto: ${newProduct.nome_prodotto}`);
      setView('list');
    } else {
      // Manual entry path (with pre-filled data)
      setScanResult(result);
      setEditingProduct(null); // Ensure we are in "Add" mode not "Edit"
    }
  };

  const handleSaveProduct = (formData: any) => {
    let updatedProducts = [...products];
    
    if (formData.id) {
      // Update existing
      updatedProducts = updatedProducts.map(p => p.id === formData.id ? { ...p, ...formData } : p);
    } else {
      // Create new
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...formData,
        scansionato_il: new Date().toISOString()
      };
      updatedProducts = [newProduct, ...updatedProducts];
    }

    setProducts(updatedProducts);
    syncCalendar(updatedProducts);
    
    // Reset states
    setScanResult(null);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      syncCalendar(updated);
      setEditingProduct(null);
  };

  const openEditor = (product: Product) => {
    setEditingProduct(product);
  };

  const openScanner = () => {
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans max-w-lg mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Content Area */}
      <div className="h-full overflow-y-auto no-scrollbar">
        {view === 'dashboard' && <Dashboard products={products} onScan={openScanner} />}
        {view === 'list' && <ProductList products={products} onEdit={openEditor} />}
        {view === 'calendar' && (
          <CalendarView 
            events={calendarEvents} 
            onEventClick={(id) => {
               const p = products.find(x => x.id === id);
               if(p) openEditor(p);
            }} 
          />
        )}
      </div>

      {/* Floating Action Button (Scanner) if not on Dashboard */}
      {view !== 'dashboard' && (
        <button 
          onClick={openScanner}
          className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95 z-30"
        >
          <ScanLine size={24} />
        </button>
      )}

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 w-full max-w-lg bg-white border-t border-gray-200 py-2 px-4 flex justify-between items-center z-20 safe-area-bottom">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1 w-16 p-1 rounded-xl transition-colors ${view === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <LayoutGrid size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 w-16 p-1 rounded-xl transition-colors ${view === 'list' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <ListIcon size={22} />
          <span className="text-[10px] font-medium">Prodotti</span>
        </button>
        
        {/* Placeholder for center alignment if needed, or just 3 items */}

        <button 
          onClick={() => setView('calendar')}
          className={`flex flex-col items-center gap-1 w-16 p-1 rounded-xl transition-colors ${view === 'calendar' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
        >
          <CalendarIcon size={22} />
          <span className="text-[10px] font-medium">Agenda</span>
        </button>
      </nav>

      {/* Overlays */}
      {isScanning && (
        <Scanner 
          onCapture={handleScan} 
          onClose={() => setIsScanning(false)} 
          isProcessing={isProcessing}
        />
      )}

      {(scanResult || editingProduct) && (
        <ProductForm 
          initialData={editingProduct}
          scanResult={scanResult}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          onCancel={() => {
            setScanResult(null);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}