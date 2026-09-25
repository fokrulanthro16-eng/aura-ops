'use client';

import React, { useState } from 'react';
import { Html, Text } from '@react-three/drei';
import { Interactive } from '@react-three/xr';
import { audioEngine } from '@/utils/audioEngine';
import {
  Activity,
  Flame,
  Radio,
  Layers,
  OctagonAlert,
  RotateCcw,
  Sparkles,
  Zap,
  Bot,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Volume2,
  VolumeX,
  Repeat,
  FileText,
  Download,
  Camera,
  TrendingUp,
} from 'lucide-react';
import { useTelemetryStore, JOINT_CONFIG, CAMERA_PRESETS, CameraPreset } from '@/store/useTelemetryStore';
import clsx from 'clsx';

// 3D Physical Spatial Button supporting both Meta Quest WebXR 6DoF hand-tracking/pointers and desktop mouse
const SpatialButton: React.FC<{
  position: [number, number, number];
  size?: [number, number, number];
  color: string;
  activeColor?: string;
  isActive?: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
  isPulsing?: boolean;
}> = ({
  position,
  size = [0.28, 0.08, 0.03],
  color,
  activeColor,
  isActive = false,
  label,
  sublabel,
  onClick,
  isPulsing = false,
}) => {
  const [hovered, setHovered] = useState(false);

  const baseColor = isActive ? activeColor || '#00f0ff' : color;
  const displayColor = hovered ? '#ffffff' : baseColor;

  return (
    <Interactive
      onSelect={() => {
        audioEngine.playClickSound();
        onClick();
      }}
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <group
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          audioEngine.playClickSound();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <mesh position={[0, 0, hovered ? 0.008 : 0]} castShadow receiveShadow>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color={displayColor}
            roughness={0.3}
            metalness={0.7}
            emissive={displayColor}
            emissiveIntensity={isActive || hovered || isPulsing ? 0.85 : 0.25}
          />
        </mesh>

        <Text
          position={[0, sublabel ? 0.012 : 0, size[2] / 2 + (hovered ? 0.01 : 0.002)]}
          fontSize={0.02}
          color={isActive ? '#020617' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {label}
        </Text>
        {sublabel && (
          <Text
            position={[0, -0.014, size[2] / 2 + (hovered ? 0.01 : 0.002)]}
            fontSize={0.013}
            color={isActive ? '#0f172a' : '#94a3b8'}
            anchorX="center"
            anchorY="middle"
          >
            {sublabel}
          </Text>
        )}
      </group>
    </Interactive>
  );
};

// 3D Physical Spatial Console mounted directly underneath the HUD screen
const SpatialXRConsole: React.FC = () => {
  const productionMode = useTelemetryStore((s) => s.productionMode);
  const toggleProductionMode = useTelemetryStore((s) => s.toggleProductionMode);
  const isMuted = useTelemetryStore((s) => s.isMuted);
  const toggleMute = useTelemetryStore((s) => s.toggleMute);
  const explodedView = useTelemetryStore((s) => s.explodedView);
  const toggleExplodedView = useTelemetryStore((s) => s.toggleExplodedView);
  const isEmergencyStopped = useTelemetryStore((s) => s.isEmergencyStopped);
  const emergencyStop = useTelemetryStore((s) => s.emergencyStop);
  const isDiagnosing = useTelemetryStore((s) => s.isDiagnosing);
  const runDiagnostics = useTelemetryStore((s) => s.runDiagnostics);
  const operationalStatus = useTelemetryStore((s) => s.operationalStatus);
  const activeCamera = useTelemetryStore((s) => s.activeCamera);
  const setCameraPreset = useTelemetryStore((s) => s.setCameraPreset);
  const generateWorkOrder = useTelemetryStore((s) => s.generateWorkOrder);
  const exportIncidentLog = useTelemetryStore((s) => s.exportIncidentLog);

  const isCritical = operationalStatus === 'CRITICAL' || isEmergencyStopped;
  const isWarning = operationalStatus === 'WARNING';
  const statusAccent = isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00f0ff';

  return (
    <group position={[0, -0.72, 0.08]} rotation={[-0.35, 0, 0]}>
      {/* Console Pedestal Deck Backing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.86, 0.46, 0.03]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Cyber Neon Trim Bezel */}
      <mesh position={[0, 0, 0.016]}>
        <boxGeometry args={[0.87, 0.47, 0.005]} />
        <meshBasicMaterial color={statusAccent} transparent opacity={0.4} />
      </mesh>

      {/* Header Banner on Console */}
      <Text
        position={[0, 0.19, 0.02]}
        fontSize={0.017}
        color={statusAccent}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        letterSpacing={0.05}
      >
        ENTERPRISE 6DoF SPATIAL COMMAND CONSOLE
      </Text>

      {/* Row 1: AI Diagnostics & Auto Pick & Place */}
      <SpatialButton
        position={[-0.21, 0.115, 0.02]}
        size={[0.38, 0.075, 0.025]}
        color="#1e293b"
        activeColor="#06b6d4"
        isActive={isDiagnosing}
        isPulsing={isDiagnosing}
        label={isDiagnosing ? '⚡ SCANNING...' : '⚡ AI DIAGNOSTICS'}
        sublabel="3-TIER NEBIUS/GEMINI"
        onClick={() => runDiagnostics()}
      />

      <SpatialButton
        position={[0.21, 0.115, 0.02]}
        size={[0.38, 0.075, 0.025]}
        color="#1e293b"
        activeColor="#10b981"
        isActive={productionMode === 'AUTO_PICK_PLACE'}
        label="🔄 AUTO P&P (P)"
        sublabel={productionMode === 'AUTO_PICK_PLACE' ? 'CYCLE: ACTIVE' : 'CYCLE: MANUAL'}
        onClick={toggleProductionMode}
      />

      {/* Row 2: Exploded View, Emergency Stop, Audio Mute */}
      <SpatialButton
        position={[-0.26, 0.025, 0.02]}
        size={[0.26, 0.07, 0.025]}
        color="#1e293b"
        activeColor="#8b5cf6"
        isActive={explodedView}
        label="💥 EXPLODE (E)"
        sublabel={explodedView ? 'EXPANDED' : 'COLLAPSED'}
        onClick={toggleExplodedView}
      />

      {/* Industrial Mushroom E-STOP Button */}
      <Interactive
        onSelect={() => {
          audioEngine.playEmergencyAlarm();
          emergencyStop();
        }}
      >
        <group
          position={[0.0, 0.025, 0.02]}
          onClick={(e) => {
            e.stopPropagation();
            audioEngine.playEmergencyAlarm();
            emergencyStop();
          }}
        >
          {/* Yellow Warning Ring Bezel */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.046, 0.048, 0.015, 32]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.7} />
          </mesh>
          {/* Red/Amber Plunger Button */}
          <mesh position={[0, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.034, 0.022, 32]} />
            <meshStandardMaterial
              color={isEmergencyStopped ? '#f59e0b' : '#ef4444'}
              emissive={isEmergencyStopped ? '#f59e0b' : '#ef4444'}
              emissiveIntensity={isEmergencyStopped ? 1.6 : 0.4}
              roughness={0.2}
              metalness={0.5}
            />
          </mesh>
          <Text
            position={[0, 0, 0.03]}
            fontSize={0.012}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {isEmergencyStopped ? 'RELEASE' : 'E-STOP'}
          </Text>
        </group>
      </Interactive>

      {/* Audio Mute/Unmute */}
      <SpatialButton
        position={[0.26, 0.025, 0.02]}
        size={[0.22, 0.07, 0.025]}
        color="#1e293b"
        activeColor="#ef4444"
        isActive={isMuted}
        label={isMuted ? '🔇 MUTED' : '🔊 AUDIO'}
        sublabel="WEB AUDIO"
        onClick={toggleMute}
      />

      {/* Row 3: CMMS Work Order & JSON Log Export */}
      <SpatialButton
        position={[-0.21, -0.065, 0.02]}
        size={[0.38, 0.07, 0.025]}
        color="#1e293b"
        activeColor="#38bdf8"
        label="📋 WORK ORDER"
        sublabel="DISPATCH SAP TICKET"
        onClick={generateWorkOrder}
      />

      <SpatialButton
        position={[0.21, -0.065, 0.02]}
        size={[0.38, 0.07, 0.025]}
        color="#1e293b"
        activeColor="#10b981"
        label="📥 EXPORT LOG"
        sublabel="INCIDENT JSON REPORT"
        onClick={exportIncidentLog}
      />

      {/* Row 4: 4 Multi-Camera Switcher Presets */}
      {(['CAM_01_ISOMETRIC', 'CAM_02_TOOL', 'CAM_03_OVERHEAD', 'CAM_04_OPERATOR'] as CameraPreset[]).map(
        (cam, idx) => {
          const cfg = CAMERA_PRESETS[cam];
          const x = -0.3 + idx * 0.2;
          return (
            <SpatialButton
              key={cam}
              position={[x, -0.155, 0.02]}
              size={[0.18, 0.065, 0.025]}
              color="#0f172a"
              activeColor="#06b6d4"
              isActive={activeCamera === cam}
              label={cfg.shortName}
              onClick={() => setCameraPreset(cam)}
            />
          );
        }
      )}
    </group>
  );
};

export const TelemetryHUD: React.FC = () => {
  const {
    operationalStatus,
    productionMode,
    toggleProductionMode,
    isMuted,
    toggleMute,
    temperature,
    vibration,
    rpm,
    hydraulicPressureBar,
    payloadKg,
    jointAngles,
    cyclePhaseName,
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

  const isWarning = operationalStatus === 'WARNING';
  const isCritical = operationalStatus === 'CRITICAL' || isEmergencyStopped;

  const statusBorderClass = isCritical
    ? 'border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
    : isWarning
    ? 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
    : 'border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]';

  const statusBadgeClass = isCritical
    ? 'bg-red-500/20 text-red-400 border-red-500/40'
    : isWarning
    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';

  const statusGlowText = isCritical
    ? 'text-red-400'
    : isWarning
    ? 'text-amber-400'
    : 'text-cyan-400';

  const diagSeverity = diagnosticResult?.severity || 'NORMAL';
  const diagBoxClass =
    diagSeverity === 'CRITICAL'
      ? 'border-red-500/50 bg-red-950/30 text-red-200'
      : diagSeverity === 'WARNING'
      ? 'border-amber-500/50 bg-amber-950/30 text-amber-200'
      : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200';

  return (
    <group position={[2.0, 1.1, -0.2]} rotation={[0, -0.42, 0]} scale={0.68}>
      {/* 3D Holographic Stanchion / Arm Anchor Pole grounded to floor */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.1, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial
          color={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00f0ff'}
          emissive={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#00f0ff'}
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* 3D Physical Spatial Console for Meta Quest VR 6DoF Hand-Tracking & Controllers */}
      <SpatialXRConsole />

      {/* Floating Spatial HTML UI Card */}
      <Html
        transform
        distanceFactor={1.75}
        center
        className="pointer-events-auto select-none"
      >
        <div
          className={clsx(
            'w-[440px] rounded-2xl bg-slate-950/92 backdrop-blur-xl p-4 border text-slate-100 transition-all duration-300 font-sans shadow-2xl',
            statusBorderClass
          )}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
            <div className="flex items-center space-x-2">
              <div className="relative flex h-3 w-3">
                <span
                  className={clsx(
                    'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                    isCritical ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-cyan-400'
                  )}
                />
                <span
                  className={clsx(
                    'relative inline-flex rounded-full h-3 w-3',
                    isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-cyan-500'
                  )}
                />
              </div>
              <div>
                <h2 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-1.5 font-mono">
                  AURA-OPS // TWIN-06
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                </h2>
                <p className="text-[9px] text-slate-400 tracking-wider font-mono">
                  ENTERPRISE INDUSTRIAL DIGITAL TWIN
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Live OEE Rating Pill */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>OEE: {oee}%</span>
              </div>

              {/* Audio Mute/Unmute */}
              <button
                onClick={toggleMute}
                title={isMuted ? 'Unmute Procedural Audio' : 'Mute Audio'}
                className="p-1 rounded-md border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition active:scale-95"
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
              </button>

              {/* Cycle Status */}
              <button
                onClick={cycleStatus}
                title="Click to cycle operational state (Simulation)"
                className={clsx(
                  'text-[9px] font-mono uppercase px-2 py-0.5 rounded-md border tracking-wider font-semibold transition hover:scale-105 active:scale-95',
                  statusBadgeClass
                )}
              >
                {isEmergencyStopped ? 'E-STOP HALT' : operationalStatus}
              </button>
            </div>
          </div>

          {/* Holographic Diagnostic Scanning Banner Badge */}
          {isDiagnosing && (
            <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold tracking-wider animate-pulse mb-2.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>SCANNING TELEMETRY... [NEBIUS / GEMINI]</span>
            </div>
          )}

          {/* Multi-Camera Channel Switcher Strip */}
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-1 rounded-xl mb-2.5 font-mono text-[9px]">
            <span className="text-slate-400 px-1.5 flex items-center gap-1 font-semibold">
              <Camera className="w-3 h-3 text-cyan-400" /> CAM:
            </span>
            <div className="flex gap-1">
              {(['CAM_01_ISOMETRIC', 'CAM_02_TOOL', 'CAM_03_OVERHEAD', 'CAM_04_OPERATOR'] as CameraPreset[]).map(
                (cam) => (
                  <button
                    key={cam}
                    onClick={() => setCameraPreset(cam)}
                    className={clsx(
                      'px-2 py-0.5 rounded transition',
                      activeCamera === cam
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {CAMERA_PRESETS[cam].shortName}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Kinematic Routine Phase Banner */}
          <div className="flex items-center justify-between bg-slate-900/70 border border-slate-800 px-2.5 py-1.5 rounded-xl mb-3 font-mono text-[9px]">
            <div className="flex items-center gap-1.5">
              <Repeat className="w-3 h-3 text-cyan-400 animate-spin-slow" />
              <span className="text-slate-400">ROUTINE:</span>
              <span className="text-white font-semibold">{cyclePhaseName}</span>
            </div>
            <button
              onClick={toggleProductionMode}
              className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/50 transition font-bold"
            >
              {productionMode === 'AUTO_PICK_PLACE' ? 'AUTO P&P' : 'HARMONIC'}
            </button>
          </div>

          {/* Primary Telemetry Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Core Temperature */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[9px] uppercase font-semibold">Core Temp</span>
                <Flame
                  className={clsx(
                    'w-3 h-3',
                    temperature > 85 ? 'text-red-400' : temperature > 65 ? 'text-amber-400' : 'text-cyan-400'
                  )}
                />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={clsx('text-lg font-bold font-mono tracking-tight', statusGlowText)}>
                  {temperature.toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-400">°C</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all duration-300',
                    temperature > 85 ? 'bg-red-500' : temperature > 65 ? 'bg-amber-500' : 'bg-cyan-400'
                  )}
                  style={{ width: `${Math.min(100, (temperature / 110) * 100)}%` }}
                />
              </div>
            </div>

            {/* Vibration RMS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[9px] uppercase font-semibold">Vibration</span>
                <Activity
                  className={clsx(
                    'w-3 h-3',
                    vibration > 4.5 ? 'text-red-400' : vibration > 2.5 ? 'text-amber-400' : 'text-cyan-400'
                  )}
                />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tracking-tight text-white">
                  {vibration.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400">mm/s</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all duration-300',
                    vibration > 4.5 ? 'bg-red-500' : vibration > 2.5 ? 'bg-amber-500' : 'bg-cyan-400'
                  )}
                  style={{ width: `${Math.min(100, (vibration / 8) * 100)}%` }}
                />
              </div>
            </div>

            {/* Spindle RPM */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[9px] uppercase font-semibold">Spindle</span>
                <Radio className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono tracking-tight text-white">
                  {rpm}
                </span>
                <span className="text-[9px] text-slate-400">RPM</span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (rpm / 2000) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Secondary Stats Strip */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-900/50 p-1.5 rounded-lg border border-slate-800/80 mb-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-cyan-400" /> Hyd. Press:
              </span>
              <span className="text-slate-200 font-semibold">{hydraulicPressureBar} bar</span>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-slate-400">Tool Payload:</span>
              <span className="text-slate-200 font-semibold">{payloadKg} kg</span>
            </div>
          </div>

          {/* 6-Axis Joint Telemetry Matrix */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                Joint Angles (J₁ – J₆)
              </span>
              <span className="text-[8px] text-cyan-400 font-mono">
                {selectedJointIndex !== null ? `FOCUS: ${JOINT_CONFIG[selectedJointIndex].id}` : 'ALL MONITORED'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {JOINT_CONFIG.map((joint, idx) => {
                const angle = jointAngles[idx];
                const isSelected = selectedJointIndex === idx;
                const range = joint.max - joint.min;
                const normalized = Math.min(100, Math.max(0, ((angle - joint.min) / range) * 100));

                return (
                  <button
                    key={joint.id}
                    onClick={() => setSelectedJointIndex(isSelected ? null : idx)}
                    className={clsx(
                      'p-1.5 rounded-lg border text-left transition-all duration-150',
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    )}
                  >
                    <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                      <span className="font-bold text-slate-200">{joint.id}</span>
                      <span className="font-mono text-[8px] text-slate-500">
                        {joint.axis.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-mono font-bold text-white">
                        {angle.toFixed(1)}°
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div
                        className={clsx(
                          'h-full transition-all duration-150',
                          isSelected ? 'bg-cyan-300' : 'bg-cyan-500/70'
                        )}
                        style={{ width: `${normalized}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Tier AI Diagnostic Copilot & Enterprise Maintenance Work-Order Actions */}
          <div className="mb-3 rounded-xl border p-2 bg-slate-900/70 border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-white">
                  AI Diagnostic Copilot
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  ● {diagnosticResult?.engineSource || 'Active'}
                </span>
                {diagnosticResult && (
                  <span className="text-[8px] font-mono text-slate-400">
                    {diagnosticResult.latencyMs}ms
                  </span>
                )}
              </div>
            </div>

            <div className={clsx('p-1.5 rounded-lg border text-[9px] font-mono space-y-0.5', diagBoxClass)}>
              <div className="flex items-start gap-1 font-semibold">
                {diagSeverity === 'CRITICAL' ? (
                  <ShieldAlert className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                ) : diagSeverity === 'WARNING' ? (
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <span>{diagnosticResult?.diagnosis || 'Telemetry analysis nominal.'}</span>
              </div>
              {diagnosticResult?.recommendedAction && (
                <p className="text-[8px] text-slate-300 leading-tight pl-4">
                  <span className="text-cyan-400 font-bold">ACTION:</span> {diagnosticResult.recommendedAction}
                </p>
              )}
            </div>

            {/* AI Diagnostics Trigger Button */}
            <button
              onClick={() => runDiagnostics()}
              disabled={isDiagnosing}
              className={clsx(
                'w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border transition-all active:scale-95',
                isDiagnosing
                  ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-not-allowed'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400'
              )}
            >
              {isDiagnosing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                  <span>Evaluating 3-Tier Model Pipeline...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>⚡ Run AI Diagnostics</span>
                </>
              )}
            </button>

            {/* Enterprise CMMS Work Order & JSON Export Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={generateWorkOrder}
                className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 text-[9px] font-mono font-bold transition active:scale-95"
              >
                <FileText className="w-3 h-3" />
                <span>📋 Work Order</span>
              </button>
              <button
                onClick={exportIncidentLog}
                className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900 text-[9px] font-mono font-bold transition active:scale-95"
              >
                <Download className="w-3 h-3" />
                <span>📥 Export Log</span>
              </button>
            </div>
          </div>

          {/* Quick-Action Command Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
            {/* Exploded View Toggle */}
            <button
              onClick={toggleExplodedView}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold tracking-wide border transition-all duration-200 active:scale-95',
                explodedView
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
              )}
            >
              <Layers className="w-3 h-3" />
              {explodedView ? 'Collapse' : 'Explode'}
            </button>

            {/* Emergency Stop (E-STOP) */}
            <button
              onClick={emergencyStop}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-[10px] font-bold tracking-wider uppercase border transition-all duration-200 active:scale-95 shadow-lg',
                isEmergencyStopped
                  ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-500 animate-pulse'
                  : 'bg-red-600/90 text-white border-red-500 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              )}
            >
              <OctagonAlert className="w-3 h-3" />
              {isEmergencyStopped ? 'Release' : 'E-STOP'}
            </button>

            {/* Reset Telemetry */}
            <button
              onClick={resetTelemetry}
              title="Reset telemetry & joint calibration"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
};
