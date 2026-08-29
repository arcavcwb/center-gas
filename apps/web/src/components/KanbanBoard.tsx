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
    
    // DB update
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
  };

  const handleCancelOrder = async (reason: string) => {
    if (!cancelingOrderId) return;
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === cancelingOrderId ? { ...o, status: 'cancelado' } : o));
    
    // DB update (reason should be saved in real DB)
    await supabase.from('orders').update({ status: 'cancelado' }).eq('id', cancelingOrderId);
    console.log('Order cancelled, reason:', reason);
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
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
        >
          <PhoneCall size={18} />
          Ingresar Pedido Manual
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna Nuevos */}
        <div className="bg-slate-200 rounded-xl p-4 min-h-[500px]">
          <h2 className="font-semibold text-slate-700 mb-4 px-2">
            NUEVOS ({newOrders.length})
          </h2>
          <div className="flex flex-col gap-2">
            {newOrders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} onCancelRequest={setCancelingOrderId} />
            ))}
            {newOrders.length === 0 && (
              <p className="text-slate-500 text-center py-8 text-sm">Sin pedidos nuevos.</p>
            )}
          </div>
        </div>

        {/* Columna Activos */}
        <div className="bg-slate-200 rounded-xl p-4 min-h-[500px]">
          <h2 className="font-semibold text-slate-700 mb-4 px-2">
            ASIGNADOS / EN CAMINO ({activeOrders.length})
          </h2>
          <div className="flex flex-col gap-2">
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
