import React, { useState } from 'react';
import { Clock } from 'lucide-react';

export default function DelaysTab({ frequencies, loading }) {
  const [sortOrder, setSortOrder] = useState('delay_desc');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <span className="ml-3 text-lg text-slate-300 font-medium">Analizando atrasos y ciclos de maduración...</span>
      </div>
    );
  }

  if (!frequencies || !frequencies.all_numbers) {
    return <div className="text-center py-10 text-slate-400">No hay datos de atrasos disponibles</div>;
  }

  let sortedList = [...frequencies.all_numbers];
  if (sortOrder === 'delay_desc') {
    sortedList.sort((a, b) => b.current_delay - a.current_delay);
  } else if (sortOrder === 'ratio_desc') {
    sortedList.sort((a, b) => b.delay_ratio - a.delay_ratio);
  } else if (sortOrder === 'num_asc') {
    sortedList.sort((a, b) => parseInt(a.number) - parseInt(b.number));
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICO_ATRASADO':
        return <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">?? Crítico Atrasado</span>;
      case 'MADURANDO':
        return <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">?? En Maduración</span>;
      case 'CALIENTE_FRECUENTE':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">?? Frecuente</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs">Normal</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Sort Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div>
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Semáforo de Demoras y Ciclos de Maduración
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Los números con <strong>Ratio &ge; 1.3x</strong> han superado su tiempo medio histórico de salida y entran en zona de alta probabilidad estadística.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Ordenar por:</span>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="delay_desc">Mayor Atraso Actual</option>
            <option value="ratio_desc">Mayor Ratio Maduración (Delay/Avg)</option>
            <option value="num_asc">Número (00 al 99)</option>
          </select>
        </div>
      </div>

      {/* Delays Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="py-3 px-4 rounded-l-lg">Ambo</th>
              <th className="py-3 px-4">Significado</th>
              <th className="py-3 px-4 text-center">Atraso Actual</th>
              <th className="py-3 px-4 text-center">Atraso Medio</th>
              <th className="py-3 px-4 text-center">Máximo Histórico</th>
              <th className="py-3 px-4 text-center">Ratio Maduración</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 rounded-r-lg">Última Salida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {sortedList.map((row) => (
              <tr key={row.number} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-black text-lg text-amber-400">
                  <span className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                    {row.number}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-200">{row.significado}</td>
                <td className="py-3.5 px-4 text-center font-black text-base text-amber-300">
                  {row.current_delay} <span className="text-xs font-normal text-slate-500">sorteos</span>
                </td>
                <td className="py-3.5 px-4 text-center text-slate-400">{row.avg_delay} st</td>
                <td className="py-3.5 px-4 text-center text-slate-500">{row.max_delay} st</td>
                <td className="py-3.5 px-4 text-center font-bold">
                  <span className={`px-2 py-0.5 rounded ${row.delay_ratio >= 1.5 ? 'text-rose-400 bg-rose-950/60' : row.delay_ratio >= 1.0 ? 'text-amber-300 bg-amber-950/60' : 'text-slate-400'}`}>
                    {row.delay_ratio}x
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">{getStatusBadge(row.status)}</td>
                <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                  {row.last_seen.date} ({row.last_seen.shift})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
