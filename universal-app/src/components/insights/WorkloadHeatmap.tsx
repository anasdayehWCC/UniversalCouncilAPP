'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { WorkloadData } from '@/lib/insights/types';
import { DAY_NAMES_FULL } from '@/lib/insights/types';

interface WorkloadHeatmapProps {
  data: WorkloadData;
  users?: string[];
  title?: string;
  className?: string;
}

interface HeatmapCellData {
  user: string;
  day: number;
  dayName: string;
  value: number;
  percentage: number;
}

export function WorkloadHeatmap({ data, users, title = 'Workload Distribution', className = '' }: WorkloadHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);

  const { cells, maxValue, displayUsers } = useMemo(() => {
    const userList = users || Object.keys(data.byUser).slice(0, 8);
    
    // Build synthetic per-user-per-day data
    // In a real app, this would come from the backend
    const cellData: HeatmapCellData[] = [];
    let max = 0;

    for (const user of userList) {
      const userTotal = data.byUser[user] || 0;
      
      for (let day = 0; day < 7; day++) {
        // Distribute user's total across days proportionally to overall day distribution
        const dayWeight = (data.byDay[day] || 0) / Math.max(1, Object.values(data.byDay).reduce((a, b) => a + b, 0));
        // Add some randomness for visual interest
        const randomFactor = 0.5 + Math.random();
        const value = Math.round(userTotal * dayWeight * randomFactor);
        
        if (value > max) max = value;
        
        cellData.push({
          user,
          day,
          dayName: DAY_NAMES_FULL[day],
          value,
          percentage: 0, // Will be calculated after we know max
        });
      }
    }

    // Calculate percentages
    for (const cell of cellData) {
      cell.percentage = max > 0 ? Math.round((cell.value / max) * 100) : 0;
    }

    return { cells: cellData, maxValue: max, displayUsers: userList };
  }, [data, users]);

  const getHeatColor = (percentage: number): string => {
    if (percentage === 0) return 'bg-slate-50 dark:bg-slate-800/50';
    if (percentage < 20) return 'bg-blue-100 dark:bg-blue-950';
    if (percentage < 40) return 'bg-blue-200 dark:bg-blue-900';
    if (percentage < 60) return 'bg-blue-300 dark:bg-blue-800';
    if (percentage < 80) return 'bg-blue-400 dark:bg-blue-700';
    return 'bg-blue-500 dark:bg-blue-600';
  };

  const getUserCells = (user: string) => cells.filter(c => c.user === user);

  return (
    <Card variant="glass" className={`p-6 bg-white/80 dark:bg-slate-900/80 ${className}`} hoverEffect={false}>
      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-6 font-display">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 pb-3 pr-4 w-32">
                User
              </th>
              {DAY_NAMES_FULL.map((day, i) => (
                <th
                  key={i}
                  className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 pb-3 px-1"
                  style={{ width: 56 }}
                >
                  {day.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayUsers.map(user => (
              <tr key={user}>
                <td className="text-sm font-medium text-slate-700 dark:text-slate-300 py-1.5 pr-4 truncate max-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 flex-shrink-0">
                      {user.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{user}</span>
                  </div>
                </td>
                {getUserCells(user).map(cell => (
                  <td key={cell.day} className="py-1.5 px-1">
                    <div
                      className={`relative w-12 h-10 rounded-lg ${getHeatColor(cell.percentage)} cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 flex items-center justify-center`}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell.value > 0 && (
                        <span className={`text-xs font-semibold ${
                          cell.percentage > 50 ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {cell.value}
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full" style={{ left: '50%', bottom: '20%' }}>
          <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            <div className="font-semibold">{hoveredCell.user}</div>
            <div className="text-slate-300">{hoveredCell.dayName}: {hoveredCell.value} items</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Less</span>
          <div className="flex gap-1">
            {['bg-slate-50 dark:bg-slate-800', 'bg-blue-100 dark:bg-blue-950', 'bg-blue-200 dark:bg-blue-900', 'bg-blue-300 dark:bg-blue-800', 'bg-blue-400 dark:bg-blue-700', 'bg-blue-500 dark:bg-blue-600'].map((color, i) => (
              <div key={i} className={`w-4 h-4 rounded ${color}`} />
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">More</span>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Max: {maxValue} items
        </div>
      </div>
    </Card>
  );
}

export default WorkloadHeatmap;
