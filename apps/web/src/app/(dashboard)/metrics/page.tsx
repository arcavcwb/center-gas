'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import CustomersTable from '@/components/CustomersTable';
import { Trophy, Gift, Users, Calendar, ArrowUpRight } from 'lucide-react';

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

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    
    // Fetch drivers
    const { data: driversData, error: dError } = await supabase.rpc('get_drivers_performance', { p_period: period });
    if (!dError && driversData) setDrivers(driversData);

    // Fetch loyalty
    const { data: loyaltyData, error: lError } = await supabase.rpc('get_loyalty_metrics');
    if (!lError && loyaltyData) setLoyalty(loyaltyData as LoyaltyMetrics);

    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Executivo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Indicadores de desempenho, fidelização e ranking de entregadores
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs">
          <Calendar size={15} className="text-slate-400 shrink-0" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent text-slate-800 text-xs sm:text-sm font-bold outline-none cursor-pointer"
          >
            <option value="today">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="all">Histórico Total</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loyalty Widget */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <Gift size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Programa de Fidelidade (8 P13)
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Retenção
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 divide-x divide-slate-100">
            <div className="text-center px-2">
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {loyalty?.near_loyalty || 0}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                A 1 passo do grátis
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md mt-2">
                <ArrowUpRight size={12} />
                <span>Alta probabilidade</span>
              </span>
            </div>

            <div className="text-center px-2">
              <p className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                {loyalty?.available_claims || 0}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                Prêmios a resgatar
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-2">
                <span>🎁 Botijão liberado</span>
              </span>
            </div>
          </div>
        </div>

        {/* Drivers Leaderboard */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Trophy size={18} />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Ranking de Entregadores
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {drivers.length} Cadastrados
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-10 text-slate-400 text-xs font-medium">
              Carregando ranking de motoboys...
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 uppercase tracking-wider font-bold">
                    <th className="pb-2.5">Motoboy</th>
                    <th className="pb-2.5 text-center">Entregas</th>
                    <th className="pb-2.5 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {drivers.map((d, i) => (
                    <tr key={d.driver_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                        {i === 0 && (
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center border border-amber-300">
                            1
                          </span>
                        )}
                        {i === 1 && (
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center border border-slate-300">
                            2
                          </span>
                        )}
                        {i === 2 && (
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-xs font-black flex items-center justify-center border border-orange-300">
                            3
                          </span>
                        )}
                        {i > 2 && (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                        )}
                        <span className="truncate">{d.full_name}</span>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700">
                        {d.total_deliveries}
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-700">
                        R$ {Number(d.total_revenue || 0).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                  {drivers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-slate-400 font-medium">
                        Nenhuma entrega finalizada no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Base de Clientes &amp; LTV (Pinheirinho)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Histórico de consumo e contagem de pontos de fidelidade
            </p>
          </div>
        </div>
        <CustomersTable />
      </div>
    </div>
  );
}
