'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Gift } from 'lucide-react';

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
    <div className="flex flex-col h-full space-y-4">
      <div className="relative w-full sm:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={15} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar por nome ou WhatsApp..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-2xs"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3 text-center">Fidelidade</th>
              <th className="px-4 py-3 text-center">Pedidos</th>
              <th className="px-4 py-3 text-right">LTV Acumulado</th>
              <th className="px-4 py-3 text-right">Último Pedido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                  Carregando base de clientes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                  Nenhum cliente encontrado para &quot;{search}&quot;.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {c.name || 'Cliente Sem Nome'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {c.phone}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {c.available_free_cylinders > 0 ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-2xs">
                        <Gift size={12} className="text-emerald-600" />
                        <span>{c.available_free_cylinders} Grátis</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md font-semibold text-xs">
                        ⭐️ {c.loyalty_points} / 8
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-slate-700">
                    {c.total_orders}
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900">
                    R$ {Number(c.total_spent || 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-500 font-medium">
                    {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString('pt-BR') : 'Sem registros'}
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
