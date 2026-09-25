'use client';

import React from 'react';
import {
  Zap,
  Clock,
  TrendingUp,
  Cpu,
  Layers,
  Leaf,
  DollarSign,
} from 'lucide-react';
import { useTelemetryStore, SparklinePoint } from '@/store/useTelemetryStore';
import clsx from 'clsx';

// Reusable SVG Sparkline Chart for real-time 30s trendlines
interface SparklineProps {
  data: SparklinePoint[];
  dataKey: 'temp' | 'vibe';
  strokeColor: string;
  fillGradientId: string;
  unit: string;
  label: string;
  minDomain?: number;
  maxDomain?: number;
  warningThreshold?: number;
}

const SparklineChart: React.FC<SparklineProps> = ({
  data,
  dataKey,
  strokeColor,
  fillGradientId,
  unit,
  label,
  minDomain,
  maxDomain,
  warningThreshold,
}) => {
  const values = data.map((d) => d[dataKey]);
  const currentVal = values.length > 0 ? values[values.length - 1] : 0;
  const isHigh = warningThreshold !== undefined && currentVal >= warningThreshold;

  const minVal = minDomain !== undefined ? minDomain : Math.min(...values, 0);
  const maxVal = maxDomain !== undefined ? maxDomain : Math.max(...values, minVal + 1);
  const range = maxVal - minVal || 1;

  const width = 280;
  const height = 55;
  const paddingY = 6;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1 || 1)) * width;
    const normalized = (val - minVal) / range;
    const y = height - paddingY - normalized * (height - paddingY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(' ');
  const areaPath = points.length > 0
    ? `M 0,${height} L ${points[0]} ${points.map((p) => `L ${p}`).join(' ')} L ${width},${height} Z`
    : '';

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-between">
      <div className="flex items-center justify-between text-[10px] mb-1 font-mono">
        <span className="text-slate-400 font-semibold uppercase">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className={clsx('text-xs font-bold font-mono', isHigh ? 'text-amber-400' : 'text-white')}>
            {currentVal.toFixed(dataKey === 'vibe' ? 2 : 1)}
          </span>
          <span className="text-[9px] text-slate-500">{unit}</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full h-[55px] relative overflow-hidden rounded">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill={`url(#${fillGradientId})`} />}

          {/* Glowing Stroke Line */}
          {polylineStr && (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylineStr}
            />
          )}

          {/* Live Pulse Dot on current point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].split(',')[0]}
              cy={points[points.length - 1].split(',')[1]}
              r="3.5"
              fill={isHigh ? '#f59e0b' : strokeColor}
              className="animate-pulse"
            />
          )}
        </svg>
      </div>

      {/* Min/Max domain scale legend */}
      <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-1">
        <span>30s ago: {values[0]?.toFixed(dataKey === 'vibe' ? 1 : 0)}{unit}</span>
        <span>Peak: {Math.max(...values, 0).toFixed(dataKey === 'vibe' ? 1 : 0)}{unit}</span>
      </div>
    </div>
  );
};

export const AnalyticsPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    oee,
    availability,
    performance,
    quality,
    powerDrawKw,
    energyCostPerHour,
    carbonKgPerHour,
    partsPerHour,
    cycleCount,
    uptimeSeconds,
    sparklineHistory,
  } = useTelemetryStore();

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const formattedUptime = `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

  const oeeColor = oee >= 85 ? 'text-emerald-400' : oee >= 65 ? 'text-amber-400' : 'text-red-400';
  const oeeBg = oee >= 85 ? 'bg-emerald-500/20 border-emerald-500/40' : oee >= 65 ? 'bg-amber-500/20 border-amber-500/40' : 'bg-red-500/20 border-red-500/40';

  return (
    <div className={clsx('space-y-3 font-sans text-slate-200', compact ? 'text-xs' : '')}>
      {/* 1. OEE Hero Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-mono">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
              Enterprise OEE Rating
            </span>
          </div>
          <span className={clsx('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border', oeeBg, oeeColor)}>
            WORLD CLASS ≥ 85%
          </span>
        </div>

        {/* Big Overall OEE Metric */}
        <div className="flex items-baseline justify-between mb-2.5 pb-2.5 border-b border-slate-800/80">
          <div>
            <span className="text-3xl font-black font-mono tracking-tight text-white">{oee}%</span>
            <span className="text-[10px] text-slate-400 font-mono ml-2">OVERALL EFFECTIVENESS</span>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-400">
            <span>SHIFT BENCHMARK</span>
            <p className="text-cyan-400 font-bold">+2.4% vs Avg</p>
          </div>
        </div>

        {/* 3 OEE Sub-Factors: Availability x Performance x Quality */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-1.5">
            <span className="text-[9px] text-slate-400 block uppercase">Availability</span>
            <span className="text-xs font-bold text-white">{availability.toFixed(1)}%</span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-cyan-400" style={{ width: `${availability}%` }} />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-1.5">
            <span className="text-[9px] text-slate-400 block uppercase">Performance</span>
            <span className="text-xs font-bold text-white">{performance.toFixed(1)}%</span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-emerald-400" style={{ width: `${performance}%` }} />
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-1.5">
            <span className="text-[9px] text-slate-400 block uppercase">Quality</span>
            <span className="text-xs font-bold text-white">{quality.toFixed(1)}%</span>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-purple-400" style={{ width: `${quality}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Production Shift Counter & Uptime Strip */}
      <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> TOTAL CYCLES
          </span>
          <span className="text-base font-bold text-white mt-1">{cycleCount.toLocaleString()}</span>
          <span className="text-[8px] text-slate-500">Pick & Place units</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-400" /> THROUGHPUT
          </span>
          <span className="text-base font-bold text-white mt-1">{partsPerHour} <span className="text-[9px] font-normal text-slate-400">PPH</span></span>
          <span className="text-[8px] text-emerald-400">Nominal 300 target</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> SHIFT UPTIME
          </span>
          <span className="text-xs font-bold text-cyan-300 mt-1">{formattedUptime}</span>
          <span className="text-[8px] text-slate-500">Shift A Active</span>
        </div>
      </div>

      {/* 3. Real-Time Energy & Environmental Footprint */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-300 font-bold flex items-center gap-1.5 uppercase">
            <Zap className="w-3 h-3 text-amber-400" /> Power Draw & Energy Cost
          </span>
          <span className="text-amber-400 font-bold">{powerDrawKw} kW</span>
        </div>

        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500 transition-all duration-300"
            style={{ width: `${Math.min(100, (powerDrawKw / 6.0) * 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 pt-1">
          <div className="flex items-center justify-between bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
            <span className="flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5 text-emerald-400" /> Rate:
            </span>
            <span className="text-white font-bold">${energyCostPerHour} / hr</span>
          </div>
          <div className="flex items-center justify-between bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/60">
            <span className="flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5 text-cyan-400" /> Carbon:
            </span>
            <span className="text-white font-bold">{carbonKgPerHour} kg/hr</span>
          </div>
        </div>
      </div>

      {/* 4. Live 30-Second Dynamic Sparklines */}
      <div className="space-y-2">
        <SparklineChart
          data={sparklineHistory}
          dataKey="temp"
          strokeColor="#06b6d4"
          fillGradientId="sparklineTempGrad"
          unit="°C"
          label="Core Thermal History (30s Trend)"
          minDomain={35}
          maxDomain={105}
          warningThreshold={75}
        />

        <SparklineChart
          data={sparklineHistory}
          dataKey="vibe"
          strokeColor="#10b981"
          fillGradientId="sparklineVibeGrad"
          unit="mm/s"
          label="Harmonic Vibration Velocity RMS"
          minDomain={0}
          maxDomain={7.5}
          warningThreshold={3.0}
        />
      </div>
    </div>
  );
};
