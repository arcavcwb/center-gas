'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import CustomersTable from '@/components/CustomersTable';

interface DriverPerformance {
  driver_id: string;
  full_name: string;
  total_deliveries: number;
  total_revenue: number;
}

interface LoyaltyMetrics {
  near_loyalty: number;
  available_claims: number;
}

export default function MetricsPage() {
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyMetrics | null>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const fetchMetrics = async () => {
    setLoading(true);
    
    // Fetch drivers
    const { data: driversData, error: dError } = await supabase.rpc('get_drivers_performance', { p_period: period });
    if (!dError && driversData) setDrivers(driversData);

    // Fetch loyalty
    const { data: loyaltyData, error: lError } = await supabase.rpc('get_loyalty_metrics');
    if (!lError && loyaltyData) setLoyalty(loyaltyData as LoyaltyMetrics);

    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Business Dashboard</h1>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm font-medium"
        >
          <option value="today">Hoy</option>
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
          <option value="all">Historico Total</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loyalty Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-orange-500 mr-2">🔥</span> Programa de Lealtad
          </h2>
          <div className="flex justify-around items-center pt-4">
            <div className="text-center">
              <p className="text-4xl font-black text-gray-800">{loyalty?.near_loyalty || 0}</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">A un paso del gratis</p>
            </div>
            <div className="h-12 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-4xl font-black text-green-600">{loyalty?.available_claims || 0}</p>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mt-1">Premios sin canjear</p>
            </div>
          </div>
        </div>

        {/* Drivers Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-blue-500 mr-2">🛵</span> Ranking Repartidores
          </h2>
          {loading ? (
             <div className="text-center text-gray-400 py-4">Cargando ranking...</div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">Motoboy</th>
                    <th className="pb-2 font-medium text-right">Entregas</th>
                    <th className="pb-2 font-medium text-right">Recaudado (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d, i) => (
                    <tr key={d.driver_id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 font-semibold text-gray-700">
                        {i === 0 && <span className="mr-2">🥇</span>}
                        {d.full_name}
                      </td>
                      <td className="py-3 text-right font-medium">{d.total_deliveries}</td>
                      <td className="py-3 text-right font-bold text-green-600">R$ {d.total_revenue}</td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-4 text-gray-400">Sin entregas registradas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="text-purple-500 mr-2">👥</span> Base de Clientes (CRM)
        </h2>
        <CustomersTable />
      </div>
    </div>
  );
}
