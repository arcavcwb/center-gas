'use client';

import React from 'react';
import { XCircle, CheckCircle2, Clock, AlertCircle, Flame, Calendar, MessageSquare, MapPin, Truck, Gift, Star } from 'lucide-react';
import type { Order } from '@center-gas/contracts';

interface OrderCardProps {
  order: Order & {
    // Dirección de ESTE pedido (orders.delivery_address); la ficha del cliente
    // ya no se sobrescribe al pedir, así que puede haber cambiado después.
    delivery_address?: string | null;
    items?: Array<{
      quantity: number;
      unit_price: number;
      product?: { name: string; sku: string };
    }>;
  };
  onUpdateStatus: (orderId: string, newStatus: string, driverId?: string) => void;
  onCancelRequest: (orderId: string) => void;
  drivers?: { id: string; full_name: string }[];
}

function getSlaInfo(createdAt: string, isScheduled: boolean) {
  if (isScheduled) {
    return {
      label: 'Agendado (08:30)',
      className: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Calendar,
    };
  }
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsedMinutes = Math.max(0, Math.floor((now - created) / 60000));

  if (elapsedMinutes < 15) {
    return {
      label: `Há ${elapsedMinutes}m`,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Clock,
    };
  } else if (elapsedMinutes < 25) {
    return {
      label: `Há ${elapsedMinutes}m • Atenção`,
      className: 'bg-amber-50 text-amber-800 border-amber-200 font-bold',
      icon: AlertCircle,
    };
  } else {
    return {
      label: `Há ${elapsedMinutes}m • Urgente`,
      className: 'bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse motion-reduce:animate-none',
      icon: Flame,
    };
  }
}

export function OrderCard({ order, onUpdateStatus, onCancelRequest, drivers = [] }: OrderCardProps) {
  const isNew = order.status === 'nuevo' || order.status === 'confirmado';
  // El grafo de transiciones de update_order_status no admite 'asignado' -> 'entregado':
  // hay que pasar por 'en_camino'. La acción de la tarjeta sigue ese camino.
  const isAssigned = order.status === 'asignado';
  const sla = getSlaInfo(order.created_at, order.is_scheduled);
  const SlaIcon = sla.icon;

  const cleanPhone = order.customer?.phone ? order.customer.phone.replace(/\D/g, '') : null;
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá ${order.customer?.name || ''}, aqui é da distribuidora Center Gás sobre seu pedido #${order.display_id}.`)}`
    : null;

  const assignedDriver = drivers.find(d => d.id === order.driver_id);

  return (
    <div className="bg-white p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 border border-slate-200/90 hover:border-slate-300 flex flex-col gap-3.5 group">
      {/* Encabezado: ID, SLA Timer y Total */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-extrabold text-base text-slate-900 tracking-tight">
            #{order.display_id}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${sla.className}`}>
            <SlaIcon size={13} className="shrink-0" />
            <span>{sla.label}</span>
          </span>
        </div>

        <div className="text-right shrink-0">
          <div className="font-extrabold text-orange-600 text-lg tracking-tight leading-none">
            R$ {order.total_amount.toFixed(2).replace('.', ',')}
          </div>
          <span className="inline-block text-xs font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded mt-1">
            {order.payment_method === 'cash' ? 'Dinheiro' : 'PIX'}
          </span>
        </div>
      </div>

      {/* Cliente y Dirección */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-800 truncate">
            {order.customer?.name || 'Cliente Sem Cadastro'}
          </p>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Abrir conversa no WhatsApp"
            >
              <MessageSquare size={12} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>

        <div className="flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin size={13} className="shrink-0 mt-0.5 text-slate-400" />
          <p className="line-clamp-2 break-words leading-snug">
            {order.delivery_address || order.customer?.address_line || 'Endereço não informado'}
          </p>
        </div>
      </div>

      {/* Fidelidad / Troco */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {order.customer && (
          (order.customer.available_free_cylinders ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Gift size={13} className="text-indigo-600 shrink-0" />
              <span>Tem Botijão Grátis!</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              <Star size={13} className="text-amber-500 fill-amber-400 shrink-0" />
              <span>{order.customer.loyalty_points || 0}/8 Pontos</span>
            </span>
          )
        )}

        {order.cash_change_for && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            Troco p/ R$ {order.cash_change_for.toFixed(2).replace('.', ',')}
          </span>
        )}
      </div>

      {/* Repartidor asignado en curso */}
      {!isNew && (assignedDriver || order.driver_name) && (
        <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg font-medium">
          <Truck size={14} className="text-blue-600 shrink-0" />
          <span>Entregador: <strong className="font-bold">{assignedDriver?.full_name || order.driver_name}</strong></span>
        </div>
      )}

      {/* Acciones del Operador */}
      <div className="flex gap-2 pt-1 border-t border-slate-100">
        {isNew ? (
          <div className="flex-1 relative">
            <select 
              onChange={(e) => {
                if (e.target.value) onUpdateStatus(order.id, 'asignado', e.target.value);
              }}
              defaultValue=""
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 py-2.5 px-3 rounded-xl font-bold text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer appearance-none"
            >
              <option value="" disabled>Despachar para entregador...</option>
              {drivers.length > 0 ? (
                drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Nenhum entregador disponível</option>
              )}
            </select>
          </div>
        ) : isAssigned ? (
          <button 
            onClick={() => onUpdateStatus(order.id, 'en_camino')}
            className="flex-1 min-h-[40px] bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Truck size={15} />
            <span>Iniciar Rota</span>
          </button>
        ) : (
          <button 
            onClick={() => onUpdateStatus(order.id, 'entregado')}
            className="flex-1 min-h-[40px] bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Confirmar Entrega</span>
          </button>
        )}

        <button 
          onClick={() => onCancelRequest(order.id)}
          className="min-h-[40px] min-w-[40px] bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 p-2 rounded-xl border border-red-200/80 transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Cancelar Pedido"
          title="Cancelar Pedido"
        >
          <XCircle size={17} />
        </button>
      </div>
    </div>
  );
}
