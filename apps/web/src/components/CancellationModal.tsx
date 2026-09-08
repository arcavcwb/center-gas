'use client';

import React, { useState } from 'react';

interface CancellationModalProps {
  orderId: string;
  displayId?: string | number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function CancellationModal({ orderId, displayId, onConfirm, onCancel }: CancellationModalProps) {
  const [reason, setReason] = useState('');
  
  const isValid = reason.trim().length >= 10;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-rose-50 border-b border-rose-100 p-5">
          <h2 className="text-xl font-bold text-rose-900">
            Cancelar Pedido #{displayId || orderId}
          </h2>
          <p className="text-rose-700 text-xs mt-1">
            Esta ação é irreversível e ficará registrada no histórico para auditoria.
          </p>
        </div>
        
        <div className="p-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Motivo do Cancelamento (Mínimo de 10 caracteres)
          </label>
          <textarea 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 outline-none transition-all resize-none text-sm text-slate-900 placeholder:text-slate-400"
            rows={4}
            placeholder="Ex.: Cliente cancelou por telefone ou endereço não localizado..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className={`text-right text-xs mt-2 font-semibold ${isValid ? 'text-emerald-600' : 'text-slate-400'}`}>
            {reason.length} / 10 caracteres
          </p>
        </div>

        <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-100">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer min-h-[40px]"
          >
            Voltar
          </button>
          <button 
            type="button"
            onClick={() => isValid && onConfirm(reason)}
            disabled={!isValid}
            className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/30 hover:bg-rose-700 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer min-h-[40px]"
          >
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}
