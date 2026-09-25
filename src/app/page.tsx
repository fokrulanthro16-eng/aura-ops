'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  Flame,
  Layers,
  OctagonAlert,
  RotateCcw,
  ShieldCheck,
  Eye,
  EyeOff,
  Cpu,
  Sliders,
  Glasses,
  Workflow,
  Bot,
  Loader2,
  Zap,
  Volume2,
  VolumeX,
  Repeat,
  Camera,
  FileText,
  Download,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useTelemetryStore, JOINT_CONFIG, CAMERA_PRESETS, CameraPreset } from '@/store/useTelemetryStore';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { WorkOrderModal } from '@/components/WorkOrderModal';
import clsx from 'clsx';

// Dynamically import Three.js SpatialCanvas to ensure purely client-side rendering
const SpatialCanvas = dynamic(
  () => import('@/components/SpatialCanvas').then((mod) => mod.SpatialCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-cyan-400 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-500/10 border-b-cyan-300 animate-spin" style={{ animationDirection: 'reverse' }} />
        </div>
        <div className="text-center font-mono space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-semibold">
            Loading Aura-Ops Enterprise Platform
          </p>
          <p className="text-[10px] text-slate-500 tracking-wider">
            WebXR Meta Quest 3 / Pro Optimization Active
          </p>
        </div>
      </div>
    ),
  }
);

// Dynamically import VRButton to safely access navigator.xr
const XRButton = dynamic(
  () => import('@react-three/xr').then((mod) => mod.VRButton),
  { ssr: false }
);

export default function DashboardPage() {
  const {
    operationalStatus,
    productionMode,
    toggleProductionMode,
    isMuted,
    toggleMute,
    cyclePhaseName,
    temperature,
    vibration,
    rpm,
    hydraulicPressureBar,
    payloadKg,
    jointAngles,
    explodedView,
    toggleExplodedView,
    selectedJointIndex,
    setSelectedJointIndex,
    isEmergencyStopped,
    emergencyStop,
    resetTelemetry,
    cycleStatus,
    diagnosticResult,
    isDiagnosing,
    runDiagnostics,
    oee,
    activeCamera,
    setCameraPreset,
    generateWorkOrder,
    exportIncidentLog,
  } = useTelemetryStore();

  const [overlayVisible, setOverlayVisible] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'kinematics' | 'metrics' | 'analytics'>('kinematics');

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'e' || e.key === 'E') {
        toggleExplodedView();
      } else if (e.key === ' ') {
        e.preventDefault();
        emergencyStop();
      } else if (e.key === 'r' || e.key === 'R') {
        resetTelemetry();
      } else if (e.key === 'd' || e.key === 'D') {
        runDiagnostics();
      } else if (e.key === 'w' || e.key === 'W') {
        generateWorkOrder();
      } else if (e.key === 'x' || e.key === 'X') {
        exportIncidentLog();
      } else if (e.key === 'c' || e.key === 'C') {
        const cameraKeys: CameraPreset[] = ['CAM_01_ISOMETRIC', 'CAM_02_TOOL', 'CAM_03_OVERHEAD', 'CAM_04_OPERATOR'];
        const curIdx = cameraKeys.indexOf(activeCamera);
        setCameraPreset(cameraKeys[(curIdx + 1) % cameraKeys.length]);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'p' || e.key === 'P') {
        toggleProductionMode();
      } else if (e.key >= '1' && e.key <= '6') {
        const index = parseInt(e.key) - 1;
        setSelectedJointIndex(selectedJointIndex === index ? null : index);
      } else if (e.key === 'h' || e.key === 'H') {
        setOverlayVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleExplodedView,
    emergencyStop,
    resetTelemetry,
    runDiagnostics,
    generateWorkOrder,
    exportIncidentLog,
    toggleMute,
    toggleProductionMode,
    activeCamera,
    setCameraPreset,
    selectedJointIndex,
    setSelectedJointIndex,
  ]);

  const isCritical = operationalStatus === 'CRITICAL' || isEmergencyStopped;
  const isWarning = operationalStatus === 'WARNING';

  const statusTheme = isCritical
    ? {
        border: 'border-red-500/50',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
        badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
        text: 'text-red-400',
        accentBg: 'bg-red-500',
      }
    : isWarning
    ? {
        border: 'border-amber-500/50',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        text: 'text-amber-400',
        accentBg: 'bg-amber-500',
      }
    : {
        border: 'border-cyan-500/40',
        glow: 'shadow-[0_0_20px_rgba(6,182,212,0.2)]',
        badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        text: 'text-cyan-400',
        accentBg: 'bg-cyan-400',
      };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#020617] font-sans select-none"
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      {/* 3D Spatial Viewport Canvas */}
      <div
        className="absolute inset-0 z-0 w-screen h-screen overflow-hidden"
        style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}
      >
        <SpatialCanvas />
      </div>

      {/* Global Enterprise CMMS Work Order Modal */}
      <WorkOrderModal />

      {/* Toggle Overlay Button (Floating bottom right) */}
      <button
        onClick={() => setOverlayVisible((v) => !v)}
        title="Toggle 2D HUD Interface (Press 'H')"
        className="absolute bottom-6 right-6 z-30 p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-white hover:border-cyan-400 transition-all duration-200 active:scale-95 shadow-xl"
      >
        {overlayVisible ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
      </button>

      {/* 2D Desktop Command Overlay */}
      {overlayVisible && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-5">
          {/* Header Bar */}
          <header className="pointer-events-auto flex items-center justify-between bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-2xl px-4 py-3 shadow-2xl transition-all duration-300">
            {/* Title & Branding */}
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
                <Workflow className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-wider uppercase text-white font-mono">
                    AURA-OPS
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    ENTERPRISE TWIN
                  </span>
                  <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    <span>OEE: {oee}%</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 tracking-wide font-mono">
                  6-AXIS INDUSTRIAL WORKCELL // WEBXR RUNTIME
                </p>
              </div>
            </div>

            {/* 4-Channel Multi-Perspective Camera Switcher */}
            <div className="hidden xl:flex items-center space-x-1 font-mono text-xs bg-slate-900/70 p-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 px-2 flex items-center gap-1 font-semibold text-[10px]">
                <Camera className="w-3.5 h-3.5 text-cyan-400" /> CAM:
              </span>
              {(['CAM_01_ISOMETRIC', 'CAM_02_TOOL', 'CAM_03_OVERHEAD', 'CAM_04_OPERATOR'] as CameraPreset[]).map(
                (cam) => (
                  <button
                    key={cam}
                    onClick={() => setCameraPreset(cam)}
                    className={clsx(
                      'px-2.5 py-1 rounded-lg transition font-bold text-[10px] tracking-wider',
                      activeCamera === cam
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    {CAMERA_PRESETS[cam].shortName}
                  </button>
                )
              )}
            </div>

            {/* Live Telemetry Glancer */}
            <div className="hidden lg:flex items-center space-x-4 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <Flame className={clsx('w-3.5 h-3.5', temperature > 80 ? 'text-red-400' : 'text-cyan-400')} />
                <div>
                  <div className="text-[9px] text-slate-400">CORE TEMP</div>
                  <span className={clsx('font-bold text-xs', statusTheme.text)}>{temperature.toFixed(1)}°C</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Activity className={clsx('w-3.5 h-3.5', vibration > 3.5 ? 'text-red-400' : 'text-cyan-400')} />
                <div>
                  <div className="text-[9px] text-slate-400">VIBRATION</div>
                  <span className="font-bold text-xs text-white">{vibration.toFixed(2)} mm/s</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <div>
                  <div className="text-[9px] text-slate-400">SPINDLE</div>
                  <span className="font-bold text-xs text-white">{rpm} RPM</span>
                </div>
              </div>

              <button
                onClick={cycleStatus}
                title="Click to simulate normal, warning, and critical telemetry states"
                className={clsx(
                  'px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase transition tracking-wider active:scale-95',
                  statusTheme.badgeBg
                )}
              >
                {isEmergencyStopped ? 'E-STOP ACTIVE' : operationalStatus}
              </button>

              {/* Kinematic Routine Mode Selector */}
              <button
                onClick={toggleProductionMode}
                title="Toggle Pick & Place Autonomous Cycle vs Harmonic Sweep (Key: P)"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-900 text-slate-200 hover:border-cyan-400 transition tracking-wider active:scale-95 text-[10px] font-bold"
              >
                <Repeat className="w-3 h-3 text-cyan-400 animate-spin-slow" />
                <span>{productionMode === 'AUTO_PICK_PLACE' ? 'AUTO P&P' : 'HARMONIC'}</span>
              </button>

              {/* Procedural Web Audio Mute Toggle */}
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute Web Audio (Key: M)' : 'Mute Web Audio (Key: M)'}
                className="p-1 rounded-lg border border-slate-700/80 bg-slate-900 text-slate-300 hover:text-white hover:border-cyan-400 transition active:scale-95"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>

            {/* Prominent Enter WebXR (Quest Hands) Trigger Button */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                <XRButton
                  sessionInit={{
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers'],
                  }}
                  style={{
                    position: 'static',
                    transform: 'none',
                    left: 'auto',
                    bottom: 'auto',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {(status) => (
                    <div className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-cyan-400/60 text-white font-mono text-xs font-bold tracking-wider hover:bg-slate-900 transition active:scale-95 cursor-pointer shadow-lg">
                      <Glasses className="w-4 h-4 text-cyan-400 animate-bounce" />
                      <span>
                        {status === 'unsupported'
                          ? 'ENTER WEBXR (QUEST HANDS)'
                          : status === 'entered'
                          ? 'EXIT IMMERSIVE XR'
                          : 'ENTER WEBXR (QUEST HANDS)'}
                      </span>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                      </span>
                    </div>
                  )}
                </XRButton>
              </div>
            </div>
          </header>

          {/* Main Body Strip: Left Telemetry Dock & Right Quick Actions */}
          <div className="flex justify-between items-start my-auto pointer-events-none">
            {/* Left Drawer: 6-Axis Kinematics, Subsystems, & OEE Analytics */}
            <div className="pointer-events-auto w-96 bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3.5 shadow-2xl space-y-3 max-h-[82vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-slate-200 font-mono">
                    Telemetry & Analytics
                  </span>
                </div>
                <div className="flex gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => setSelectedTab('kinematics')}
                    className={clsx(
                      'px-2 py-0.5 rounded transition',
                      selectedTab === 'kinematics' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    Axes
                  </button>
                  <button
                    onClick={() => setSelectedTab('metrics')}
                    className={clsx(
                      'px-2 py-0.5 rounded transition',
                      selectedTab === 'metrics' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    Plant
                  </button>
                  <button
                    onClick={() => setSelectedTab('analytics')}
                    className={clsx(
                      'px-2 py-0.5 rounded transition flex items-center gap-1',
                      selectedTab === 'analytics' ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                    )}
                  >
                    <BarChart3 className="w-3 h-3 text-emerald-400" />
                    OEE
                  </button>
                </div>
              </div>

              {selectedTab === 'kinematics' ? (
                <div className="space-y-1.5">
                  {JOINT_CONFIG.map((joint, idx) => {
                    const angle = jointAngles[idx];
                    const isSelected = selectedJointIndex === idx;
                    const range = joint.max - joint.min;
                    const normalized = Math.min(100, Math.max(0, ((angle - joint.min) / range) * 100));

                    return (
                      <div
                        key={joint.id}
                        onClick={() => setSelectedJointIndex(isSelected ? null : idx)}
                        className={clsx(
                          'p-2 rounded-xl border text-left cursor-pointer transition-all duration-150',
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                        )}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono font-bold text-white">{joint.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{joint.name}</span>
                          <span className="font-mono font-bold text-cyan-400">{angle.toFixed(1)}°</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full transition-all duration-150',
                              isSelected ? 'bg-cyan-300' : 'bg-cyan-500'
                            )}
                            style={{ width: `${normalized}%` }}
                          />
                        </div>
                        {isSelected && (
                          <p className="text-[9px] text-slate-400 mt-1 font-mono leading-tight">
                            {joint.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : selectedTab === 'metrics' ? (
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Hydraulic Pressure</span>
                    <span className="text-white font-bold">{hydraulicPressureBar} BAR</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Active End-Effector Payload</span>
                    <span className="text-white font-bold">{payloadKg} KG</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Current Routine Phase</span>
                    <span className="text-cyan-400 font-bold">{cyclePhaseName}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Thermal Threshold</span>
                    <span className={clsx('font-bold', statusTheme.text)}>
                      {temperature > 85 ? 'HIGH ALERT' : 'NOMINAL'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Enterprise Analytics Tab with OEE & Live Sparklines */
                <AnalyticsPanel compact />
              )}
            </div>

            {/* Right Drawer: Quick Action & Enterprise Command Dock */}
            <div className="pointer-events-auto w-80 bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-4 shadow-2xl space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Command Dock
                </span>
                <span className="text-[10px] text-cyan-400">[HOTKEYS]</span>
              </div>

              {/* Kinematic Mode Toggle */}
              <div className="space-y-1">
                <button
                  onClick={toggleProductionMode}
                  className={clsx(
                    'w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 shadow-lg',
                    productionMode === 'AUTO_PICK_PLACE'
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/80 text-white border-slate-700/80 hover:border-slate-600 hover:bg-slate-850'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                    <span>{productionMode === 'AUTO_PICK_PLACE' ? 'Auto Pick & Place' : 'Harmonic Sweep'}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-normal">
                    KEY: P
                  </span>
                </button>
              </div>

              {/* Exploded View Toggle */}
              <button
                onClick={toggleExplodedView}
                className={clsx(
                  'w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 shadow-lg',
                  explodedView
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/80 text-white border-slate-700/80 hover:border-slate-600 hover:bg-slate-850'
                )}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{explodedView ? 'Collapse Assembly' : 'Exploded View'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-normal">
                  KEY: E
                </span>
              </button>

              {/* Emergency Stop (E-STOP) */}
              <button
                onClick={emergencyStop}
                className={clsx(
                  'w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold uppercase transition-all duration-200 active:scale-95 shadow-xl',
                  isEmergencyStopped
                    ? 'bg-amber-600 text-white border-amber-400 hover:bg-amber-500 animate-pulse'
                    : 'bg-red-600/90 text-white border-red-500 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <OctagonAlert className="w-4 h-4" />
                  <span>{isEmergencyStopped ? 'Release E-STOP' : 'Emergency Stop'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-normal">
                  SPACE
                </span>
              </button>

              {/* 3-Tier AI Diagnostic Copilot & CMMS Work Order Dispatcher */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      AI Diagnostic Copilot
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                    ● {diagnosticResult?.engineSource || 'Active'}
                  </span>
                </div>

                {diagnosticResult && (
                  <div
                    className={clsx(
                      'p-2 rounded-lg border text-[10px] space-y-1',
                      diagnosticResult.severity === 'CRITICAL'
                        ? 'border-red-500/50 bg-red-950/30 text-red-200'
                        : diagnosticResult.severity === 'WARNING'
                        ? 'border-amber-500/50 bg-amber-950/30 text-amber-200'
                        : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200'
                    )}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>⚡ {diagnosticResult.diagnosis}</span>
                      <span className="text-[9px] text-slate-400 font-normal">
                        {diagnosticResult.latencyMs}ms
                      </span>
                    </div>
                    {diagnosticResult.recommendedAction && (
                      <p className="text-[9px] text-slate-300 font-medium">
                        <span className="text-cyan-400 font-bold">Action:</span> {diagnosticResult.recommendedAction}
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => runDiagnostics()}
                  disabled={isDiagnosing}
                  className={clsx(
                    'w-full flex items-center justify-between p-2 rounded-lg border text-xs font-bold transition active:scale-95',
                    isDiagnosing
                      ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {isDiagnosing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{isDiagnosing ? 'Evaluating Models...' : 'Run Diagnostics'}</span>
                  </div>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 text-slate-400">
                    KEY: D
                  </span>
                </button>

                {/* Enterprise CMMS Work Order Dispatcher & Export Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={generateWorkOrder}
                    title="Generate and dispatch enterprise maintenance ticket (Key: W)"
                    className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-bold transition active:scale-95 shadow-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Work Order</span>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 text-slate-400">
                      W
                    </span>
                  </button>
                  <button
                    onClick={exportIncidentLog}
                    title="Download raw incident telemetry & AI diagnosis JSON (Key: X)"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-850 text-xs font-bold transition active:scale-95 shadow-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export Log</span>
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-black/40 text-slate-400">
                      X
                    </span>
                  </button>
                </div>
              </div>

              {/* Reset Calibration */}
              <button
                onClick={resetTelemetry}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 text-xs transition active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Calibration</span>
                </div>
                <span className="text-[10px] text-slate-500">KEY: R</span>
              </button>

              {/* Camera Cycle Quick-Action */}
              <button
                onClick={() => {
                  const cameraKeys: CameraPreset[] = ['CAM_01_ISOMETRIC', 'CAM_02_TOOL', 'CAM_03_OVERHEAD', 'CAM_04_OPERATOR'];
                  const curIdx = cameraKeys.indexOf(activeCamera);
                  setCameraPreset(cameraKeys[(curIdx + 1) % cameraKeys.length]);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500 text-xs transition active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cycle Camera Angle</span>
                </div>
                <span className="text-[10px] text-slate-500">KEY: C</span>
              </button>
            </div>
          </div>

          {/* Footer Bar */}
          <footer className="pointer-events-auto flex items-center justify-between bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-2xl px-5 py-2.5 shadow-2xl text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">OSHA SAFETY PERIMETER: ENGAGED</span>
              </div>
              <div className="hidden sm:inline">
                LATENCY: <span className="text-cyan-400 font-bold">&lt; 3.8ms</span> (WebXR Quest 3 / Pro)
              </div>
              <div className="hidden md:inline">
                ACTIVE VIEW: <span className="text-cyan-400 font-bold">{CAMERA_PRESETS[activeCamera].name}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-[11px] text-slate-500">
                [C] CAMERA // [W] WORK ORDER // [X] EXPORT // [P] AUTO P&P // [M] AUDIO // [E] EXPLODE
              </span>
            </div>
          </footer>
        </div>
      )}
    </main>
  );
}
