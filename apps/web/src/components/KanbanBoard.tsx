'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { OrderCard } from './OrderCard';
import { CancellationModal } from './CancellationModal';
import { NewOrderModal } from './NewOrderModal';
import type { Order } from '@center-gas/contracts';
import { PhoneCall } from 'lucide-react';

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  useEffect(() => {
    // Initial fetch (in a real app we would join customers etc.)
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers (name, phone, address_line, loyalty_points, available_free_cylinders),
          items:order_items (*)
        `)
        .neq('status', 'cancelado')
        .neq('status', 'entregado')
        .order('created_at', { ascending: true });
      
      if (data && !error) {
        setOrders(data as Order[]);
      }
    };

    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase.channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // Fetch the fully populated order to get relations (customer, items)
          const { data } = await supabase
            .from('orders')
            .select(`*, customer:customers (name, phone, address_line, loyalty_points, available_free_cylinders), items:order_items (*)`)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            if (payload.eventType === 'INSERT') {
              setOrders(prev => [...prev, data as Order]);
            } else {
              setOrders(prev => prev.map(o => o.id === data.id ? data as Order : o));
            }
          }
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
    
    // DB update using RPC to track history
    await supabase.rpc('update_order_status', { 
      p_order_id: orderId, 
      p_new_status: newStatus 
    });
  };

  const handleCancelOrder = async (reason: string) => {
    if (!cancelingOrderId) return;
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === cancelingOrderId ? { ...o, status: 'cancelado' } : o));
    
    // DB update using RPC to track history and reason
    await supabase.rpc('update_order_status', { 
      p_order_id: cancelingOrderId, 
      p_new_status: 'cancelado',
      p_reason: reason
    });
    setCancelingOrderId(null);
  };

  const handleCreateManualOrder = () => {
    setIsNewOrderModalOpen(false);
  };

  const newOrders = orders.filter(o => o.status === 'nuevo' || o.status === 'confirmado');
  const activeOrders = orders.filter(o => o.status === 'asignado' || o.status === 'en_camino');

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Panel de Control B2B</h1>
        <button 
          onClick={() => setIsNewOrderModalOpen(true)}
          className="bg-brand-orange hover:bg-brand-orange-hover text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <PhoneCall size={18} />
          Ingresar Pedido Manual
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Nuevos */}
        <div className="bg-white/60 border border-slate-200/60 backdrop-blur-sm shadow-sm rounded-xl p-4 min-h-[500px]">
          <div className="flex items-center gap-2 mb-4 px-2">
            <h2 className="font-semibold text-slate-800 tracking-tight">Nuevos</h2>
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {newOrders.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {newOrders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onCancelRequest={setCancelingOrderId} />
            ))}
            {newOrders.length === 0 && (
              <p className="text-slate-500 text-center py-8 text-sm">Sin pedidos nuevos.</p>
            )}
          </div>
        </div>

        {/* Columna Activos */}
        <div className="bg-white/60 border border-slate-200/60 backdrop-blur-sm shadow-sm rounded-xl p-4 min-h-[500px]">
          <div className="flex items-center gap-2 mb-4 px-2">
            <h2 className="font-semibold text-slate-800 tracking-tight">Asignados / En Camino</h2>
            <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-2 py-0.5 rounded-full">
              {activeOrders.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {activeOrders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onCancelRequest={setCancelingOrderId} />
            ))}
            {activeOrders.length === 0 && (
              <p className="text-slate-500 text-center py-8 text-sm">Sin pedidos activos.</p>
            )}
          </div>
        </div>
      </div>

      {cancelingOrderId && (
        <CancellationModal 
          orderId={cancelingOrderId} 
          onConfirm={handleCancelOrder} 
          onCancel={() => setCancelingOrderId(null)} 
        />
      )}
      
      {isNewOrderModalOpen && (
        <NewOrderModal 
          onConfirm={handleCreateManualOrder} 
          onCancel={() => setIsNewOrderModalOpen(false)} 
        />
      )}
    </div>
  );
}
