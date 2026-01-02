import React, { useState, useEffect } from 'react';
import { Product, ScanResult } from '../types';
import { Save, X, Calendar as CalendarIcon, Package, Barcode, Trash2, AlertTriangle } from 'lucide-react';

interface ProductFormProps {
  initialData?: Partial<Product> | null;
  scanResult?: ScanResult | null;
  onSave: (product: Omit<Product, 'id' | 'scansionato_il'> & { id?: string, scansionato_il?: string }) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ initialData, scanResult, onSave, onDelete, onCancel }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [expiry, setExpiry] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.nome_prodotto || '');
      setCode(initialData.codice_ean_qr || '');
      setExpiry(initialData.data_scadenza || '');
    } else if (scanResult) {
      setName(scanResult.nome_prodotto || '');
      setCode(scanResult.codice_ean_qr || '');
      setExpiry(scanResult.data_scadenza || '');
    }
  }, [initialData, scanResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nome_prodotto: name,
      codice_ean_qr: code,
      data_scadenza: expiry || null,
      ...(initialData?.id ? { id: initialData.id, scansionato_il: initialData.scansionato_il } : {})
    });
  };

  const handleConfirmDelete = () => {
    if (initialData?.id && onDelete) {
      onDelete(initialData.id);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {initialData?.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Prodotto</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Package size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Es. Latte Intero"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Codice EAN / QR</label>
             <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Barcode size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Scannerizza o inserisci"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza</label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="date"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {expiry ? 'Prodotto scadrà il ' + new Date(expiry).toLocaleDateString() : 'Inserisci la data stampata sul prodotto'}
            </p>
          </div>

          <div className="pt-4">
            {showDeleteConfirm ? (
              <div className="bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-3 text-red-800 font-medium">
                  <AlertTriangle size={18} />
                  <span>Eliminare questo prodotto?</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                  >
                    Conferma Eliminazione
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                {initialData?.id && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 font-medium flex items-center justify-center transition-colors"
                    title="Elimina prodotto"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <Save size={18} />
                  {initialData?.id ? 'Aggiorna' : 'Salva'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;