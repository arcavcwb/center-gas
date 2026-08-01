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
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-gray-800">#{order.display_id}</span>
          <p className="text-sm font-semibold text-gray-700 mt-1">{(order as any).customer?.full_name || order.customer_id}</p>
          <p className="text-xs text-gray-500">{(order as any).customer?.address || 'Sin dirección'}</p>
        </div>
        <div className="text-right">
          <span className="font-bold text-orange-600">R$ {order.total_amount.toFixed(2)}</span>
          <p className="text-xs text-gray-500 uppercase">{order.payment_method}</p>
        </div>
      </div>
      
      {order.cash_change_for && (
        <div className="bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded inline-block font-medium w-fit">
          Troco para: R$ {order.cash_change_for.toFixed(2)}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        {isNew ? (
          <select 
            onChange={(e) => {
              if (e.target.value) onUpdateStatus(order.id, 'asignado');
            }}
            defaultValue=""
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm outline-none focus:border-blue-500"
          >
            <option value="" disabled>Seleccionar Motoboy...</option>
            <option value="driver1">Carlos (Zona Norte)</option>
            <option value="driver2">João (Zona Sur)</option>
            <option value="driver3">Pedro (Centro)</option>
          </select>
        ) : (
          <button 
            onClick={() => onUpdateStatus(order.id, 'entregado')}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition flex items-center justify-center gap-1"
          >
            <CheckCircle size={16} />
            Entregado
          </button>
        )}
        <button 
          onClick={() => onCancelRequest(order.id)}
          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition"
          aria-label="Cancelar Pedido"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}
