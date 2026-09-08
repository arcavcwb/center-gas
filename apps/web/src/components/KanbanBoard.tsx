'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { OrderCard } from './OrderCard';
import { CancellationModal } from './CancellationModal';
import { NewOrderModal } from './NewOrderModal';
import type { Order } from '@center-gas/contracts';
import { PhoneCall, Search, Package, Truck, DollarSign, Users, CheckCircle2, RefreshCw } from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
}

export function KanbanBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    setIsRefreshing(true);
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
    setIsRefreshing(false);
  };

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'driver')
      .eq('is_active', true);

    if (data && !error) {
      setDrivers(data as Driver[]);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDrivers();

    // Subscribe to realtime changes
    const channel = supabase.channel('realtime_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
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

  const handleUpdateStatus = async (orderId: string, newStatus: string, driverId?: string) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
    
    // DB update using RPC to track history
    await supabase.rpc('update_order_status', { 
      p_order_id: orderId, 
      p_new_status: newStatus,
      p_driver_id: driverId || null
    });
  };

  const handleCancelOrder = async (reason: string) => {
    if (!cancelingOrderId) return;
    setOrders(prev => prev.map(o => o.id === cancelingOrderId ? { ...o, status: 'cancelado' } : o));
    
    await supabase.rpc('update_order_status', { 
      p_order_id: cancelingOrderId, 
      p_new_status: 'cancelado',
      p_reason: reason
    });
    setCancelingOrderId(null);
  };

  const handleCreateManualOrder = () => {
    setIsNewOrderModalOpen(false);
    fetchOrders();
  };

  // Filtrado de pedidos
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(o => 
      o.display_id.toLowerCase().includes(q) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
      (o.customer?.phone && o.customer.phone.includes(q)) ||
      (o.customer?.address_line && o.customer.address_line.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  const newOrders = filteredOrders.filter(o => o.status === 'nuevo' || o.status === 'confirmado');
  const activeOrders = filteredOrders.filter(o => o.status === 'asignado' || o.status === 'en_camino');

  // Métricas rápidas del turno
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header y Acción Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Painel de Operações &amp; Despacho
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Gestão em tempo real das entregas no Pinheirinho e região
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchOrders}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Atualizar Pedidos"
            aria-label="Atualizar Pedidos"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-orange-600' : ''} />
          </button>

          <button 
            onClick={() => setIsNewOrderModalOpen(true)}
            className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-600/20 hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneCall size={17} />
            <span>Novo Pedido Manual</span>
          </button>
        </div>
      </div>

      {/* Barra de KPIs Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Package size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Pendentes</span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {newOrders.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Truck size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Em Rota</span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {activeOrders.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total do Turno</span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              R$ {totalRevenue.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Entregadores</span>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {drivers.length}
            </span>
          </div>
        </div>
      </div>

      {/* Buscador Dinámico */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input 
          type="text"
          placeholder="Buscar por cliente, endereço, telefone ou #ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Columnas del Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Columna: Nuevos / Por Asignar */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 min-h-[540px] flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Novos Pedidos (Aguardando Despacho)
              </h2>
            </div>
            <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-amber-200">
              {newOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-3.5 flex-1">
            {newOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                drivers={drivers} 
                onUpdateStatus={handleUpdateStatus} 
                onCancelRequest={setCancelingOrderId} 
              />
            ))}

            {newOrders.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Tudo em dia!</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Nenhum pedido pendente aguardando atribuição de motoboy no momento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna: Asignados / En Camino */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 min-h-[540px] flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">
                Em Rota de Entrega (Ativos)
              </h2>
            </div>
            <span className="bg-blue-100 text-blue-900 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-200">
              {activeOrders.length}
            </span>
          </div>

          <div className="flex flex-col gap-3.5 flex-1">
            {activeOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                drivers={drivers} 
                onUpdateStatus={handleUpdateStatus} 
                onCancelRequest={setCancelingOrderId} 
              />
            ))}

            {activeOrders.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                  <Truck size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">Nenhum motoboy em rota</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Quando você despachar um pedido com motoboy, ele aparecerá aqui até ser concluído.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {cancelingOrderId && (
        <CancellationModal 
          orderId={cancelingOrderId} 
          displayId={orders.find(o => o.id === cancelingOrderId)?.display_id}
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
