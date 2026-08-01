'use client';

import React, { useState } from 'react';

interface CancellationModalProps {
  orderId: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function CancellationModal({ orderId, onConfirm, onCancel }: CancellationModalProps) {
  const [reason, setReason] = useState('');
  
  const isValid = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-red-50 border-b border-red-100 p-5">
          <h2 className="text-xl font-bold text-red-800">Cancelar Pedido #{orderId}</h2>
          <p className="text-red-600 text-sm mt-1">Esta acción es irreversible y quedará registrada para auditoría.</p>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Motivo de la cancelación (Mín. 10 caracteres)
          </label>
          <textarea 
            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none transition-all resize-none"
            rows={4}
            placeholder="Ej: El cliente canceló porque no estaba en casa..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="text-right text-xs mt-2 font-medium" style={{ color: isValid ? '#16a34a' : '#ef4444' }}>
            {reason.length} / 10
          </p>
        </div>

        <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-100">
          <button 
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Volver
          </button>
          <button 
            onClick={() => isValid && onConfirm(reason)}
            disabled={!isValid}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-500/30 hover:bg-red-700 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
}
