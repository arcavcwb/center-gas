'use client';

import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import type { Order } from '@center-gas/contracts';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onCancelRequest: (orderId: string) => void;
}

export function OrderCard({ order, onUpdateStatus, onCancelRequest }: OrderCardProps) {
  const isNew = order.status === 'nuevo' || order.status === 'confirmado';
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 border border-slate-100 flex flex-col gap-4 group">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-slate-800 tracking-tight">#{order.display_id}</span>
          <p className="text-sm font-semibold text-slate-700 mt-1">{order.customer?.name || order.customer_id}</p>
          <p className="text-xs text-slate-500 mt-0.5">{order.customer?.address_line || 'Sin dirección'}</p>
          
          {order.customer && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(order.customer.available_free_cylinders ?? 0) > 0 ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                  🎁 ¡Tiene Botellón Gratis!
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10">
                  ⭐️ {order.customer.loyalty_points || 0}/8 Puntos
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="font-bold text-brand-orange text-lg tracking-tight">R$ {order.total_amount.toFixed(2)}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded mt-1">{order.payment_method}</span>
        </div>
      </div>
      
      {order.cash_change_for && (
        <div className="bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1.5 rounded-md inline-flex items-center font-medium w-fit ring-1 ring-inset ring-yellow-600/20">
          Troco para: R$ {order.cash_change_for.toFixed(2)}
        </div>
      )}

      <div className="flex gap-2 mt-1">
        {isNew ? (
          <select 
            onChange={(e) => {
              if (e.target.value) onUpdateStatus(order.id, 'asignado');
            }}
            defaultValue=""
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-lg font-medium text-sm outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors cursor-pointer appearance-none"
          >
            <option value="" disabled>Asignar Motoboy...</option>
            <option value="driver1">Carlos (Zona Norte)</option>
            <option value="driver2">João (Zona Sur)</option>
            <option value="driver3">Pedro (Centro)</option>
          </select>
        ) : (
          <button 
            onClick={() => onUpdateStatus(order.id, 'entregado')}
            className="flex-1 bg-emerald-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-emerald-600 shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle size={16} />
            Entregado
          </button>
        )}
        <button 
          onClick={() => onCancelRequest(order.id)}
          className="bg-red-50 text-red-600 p-2.5 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors flex items-center justify-center ring-1 ring-inset ring-red-600/10"
          aria-label="Cancelar Pedido"
        >
          <XCircle size={18} />
        </button>
      </div>
    </div>
  );
}
