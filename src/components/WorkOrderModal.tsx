'use client';

import React from 'react';
import {
  FileText,
  X,
  Download,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Wrench,
  UserCheck,
  CheckCircle2,
  Building2,
  Cpu,
  Package,
} from 'lucide-react';
import { useTelemetryStore } from '@/store/useTelemetryStore';
import clsx from 'clsx';

export const WorkOrderModal: React.FC = () => {
  const {
    activeWorkOrder,
    isWorkOrderModalOpen,
    closeWorkOrderModal,
    exportIncidentLog,
  } = useTelemetryStore();

  if (!isWorkOrderModalOpen || !activeWorkOrder) return null;

  const isCritical = activeWorkOrder.urgency === 'P1-CRITICAL';
  const isWarning = activeWorkOrder.urgency === 'P2-WARNING';

  const urgencyBadgeClass = isCritical
    ? 'bg-red-500/20 text-red-400 border-red-500/50'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  ENTERPRISE CMMS WORK ORDER
                </h3>
                <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold border', urgencyBadgeClass)}>
                  {activeWorkOrder.urgency}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                DISPATCH TICKET ID: <span className="text-cyan-300 font-bold">{activeWorkOrder.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeWorkOrderModal}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Dispatch Routing Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px]">
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-cyan-400" /> Plant Location:
              </span>
              <p className="text-white font-semibold">{activeWorkOrder.workcellLocation}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Timestamp:
              </span>
              <p className="text-slate-300">{activeWorkOrder.createdAt}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-emerald-400" /> Assigned Field Crew:
              </span>
              <p className="text-emerald-300 font-semibold">{activeWorkOrder.assignedEngineer}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" /> ERP Integration:
              </span>
              <p className="text-cyan-300 font-semibold">✓ Synced with SAP PM / Maximo</p>
            </div>
          </div>

          {/* AI Root Cause & Diagnosis Section */}
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="flex items-center gap-1.5 uppercase">
                {isCritical ? (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Cpu className="w-4 h-4 text-cyan-400" />
                )}
                AI Diagnostic Summary ({activeWorkOrder.engineSource})
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1.5">
              <p className="text-slate-200">
                <strong className="text-cyan-400">Diagnosis: </strong>
                {activeWorkOrder.diagnosisSummary}
              </p>
              <p className="text-slate-300">
                <strong className="text-amber-400">Root Cause: </strong>
                {activeWorkOrder.rootCause}
              </p>
              <p className="text-slate-300">
                <strong className="text-emerald-400">Prescribed Intervention: </strong>
                {activeWorkOrder.recommendedAction}
              </p>
            </div>
          </div>

          {/* Recommended Spare Part SKU */}
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-white">
              <span className="flex items-center gap-1.5 uppercase">
                <Package className="w-4 h-4 text-cyan-400" /> Recommended Spare Part SKU
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">
                ● Stocked (Warehouse Bay B-14)
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-[11px]">
              <div>
                <span className="font-bold text-cyan-300 text-xs block">{activeWorkOrder.sku}</span>
                <span className="text-[10px] text-slate-400">{activeWorkOrder.skuDescription}</span>
              </div>
              <button
                onClick={() => alert(`Part reservation requisition confirmed for ${activeWorkOrder.sku}. Transfer ticket generated.`)}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition text-[10px] font-bold whitespace-nowrap"
              >
                Reserve Part
              </button>
            </div>
          </div>

          {/* Incident Telemetry Snapshot Strip */}
          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/80 space-y-1 text-[10px]">
            <span className="text-slate-400 uppercase font-bold block mb-1">
              Incident Telemetry Snapshot
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">CORE TEMP</span>
                <span className="text-white font-bold">{activeWorkOrder.telemetrySnapshot.coreTemp}°C</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">VIBRATION</span>
                <span className="text-white font-bold">{activeWorkOrder.telemetrySnapshot.vibration} mm/s</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">SPINDLE</span>
                <span className="text-white font-bold">{activeWorkOrder.telemetrySnapshot.rpm} RPM</span>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block">HYD. PRESS</span>
                <span className="text-white font-bold">{activeWorkOrder.telemetrySnapshot.hydraulicPressure} BAR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/90 border-t border-slate-800">
          <button
            onClick={exportIncidentLog}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition active:scale-95 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Incident Log (JSON)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeWorkOrderModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert(`Work order ${activeWorkOrder.id} dispatched to field crew via Plant Radio & SMS.`);
                closeWorkOrderModal();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition text-xs font-bold shadow-lg"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
