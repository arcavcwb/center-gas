'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CustomerStats {
  id: string;
  name: string | null;
  phone: string;
  loyalty_points: number;
  available_free_cylinders: number;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export default function CustomersTable() {
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [filtered, setFiltered] = useState<CustomerStats[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(customers);
    } else {
      const lower = search.toLowerCase();
      setFiltered(customers.filter(c => 
        (c.name && c.name.toLowerCase().includes(lower)) || 
        c.phone.includes(lower)
      ));
    }
  }, [search, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_customers_with_stats');
    if (!error && data) {
      setCustomers(data);
      setFiltered(data);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/3 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3 text-center">Fidelidad</th>
              <th className="px-4 py-3 text-center">Pedidos</th>
              <th className="px-4 py-3 text-right">LTV (Total R$)</th>
              <th className="px-4 py-3 text-right">Último Pedido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando clientes...</td></tr>
            ) : filtered.length === 0 ? (
               <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay clientes con ese criterio</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-semibold text-gray-700">{c.name || 'Sin nombre'}</td>
                  <td className="px-4 py-4 text-gray-600">{c.phone}</td>
                  <td className="px-4 py-4 text-center">
                    {c.available_free_cylinders > 0 ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">🎁 {c.available_free_cylinders} Gratis</span>
                    ) : (
                      <span className="text-gray-500 font-medium">{c.loyalty_points} / 8</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-gray-700">{c.total_orders}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-800">R$ {c.total_spent}</td>
                  <td className="px-4 py-4 text-right text-gray-500">
                    {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
