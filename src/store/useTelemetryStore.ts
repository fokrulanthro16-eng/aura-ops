import { create } from 'zustand';
import { audioEngine } from '@/utils/audioEngine';

export type OperationalStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type ProductionMode = 'AUTO_PICK_PLACE' | 'HARMONIC';
export type CameraPreset = 'CAM_01_ISOMETRIC' | 'CAM_02_TOOL' | 'CAM_03_OVERHEAD' | 'CAM_04_OPERATOR';

export interface JointMetadata {
  id: string;
  name: string;
  axis: string;
  min: number;
  max: number;
  description: string;
}

export interface DiagnosticResult {
  diagnosis: string;
  rootCause: string;
  recommendedAction: string;
  severity: OperationalStatus;
  engineSource: 'Nebius Nemotron' | 'Google Gemini' | 'Autonomous Edge';
  latencyMs: number;
  timestamp: number;
}

export interface CameraPresetConfig {
  id: CameraPreset;
  name: string;
  shortName: string;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  description: string;
}

export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  CAM_01_ISOMETRIC: {
    id: 'CAM_01_ISOMETRIC',
    name: 'CAM 01: ISOMETRIC WORKCELL',
    shortName: 'CAM 01: ISO',
    position: [0, 2.0, 4.4],
    target: [0, 1.0, 0],
    fov: 48,
    description: 'Default dynamic overview of the entire 6-axis workcell',
  },
  CAM_02_TOOL: {
    id: 'CAM_02_TOOL',
    name: 'CAM 02: TOOL END-EFFECTOR',
    shortName: 'CAM 02: TOOL',
    position: [0.65, 1.35, 1.0],
    target: [0.1, 0.95, 0.3],
    fov: 42,
    description: 'High-detail close-up of pneumatic parallel gripper & flange',
  },
  CAM_03_OVERHEAD: {
    id: 'CAM_03_OVERHEAD',
    name: 'CAM 03: OVERHEAD CRANE',
    shortName: 'CAM 03: TOP',
    position: [0.01, 5.0, 0.01],
    target: [0, 0, 0],
    fov: 52,
    description: 'Direct top-down bird-eye view of workcell footprint & perimeter',
  },
  CAM_04_OPERATOR: {
    id: 'CAM_04_OPERATOR',
    name: 'CAM 04: OPERATOR VIEW',
    shortName: 'CAM 04: OPERATOR',
    position: [-2.2, 1.65, 2.8],
    target: [0, 0.95, 0],
    fov: 50,
    description: 'Eye-level operator perspective outside safety barrier perimeter',
  },
};

export interface SparklinePoint {
  time: number;
  temp: number;
  vibe: number;
}

export interface WorkOrder {
  id: string;
  createdAt: string;
  urgency: 'P1-CRITICAL' | 'P2-WARNING' | 'P3-ROUTINE';
  status: 'DISPATCHED' | 'IN_PROGRESS' | 'RESOLVED';
  sku: string;
  skuDescription: string;
  assignedEngineer: string;
  workcellLocation: string;
  diagnosisSummary: string;
  rootCause: string;
  recommendedAction: string;
  engineSource: string;
  telemetrySnapshot: {
    coreTemp: number;
    vibration: number;
    rpm: number;
    hydraulicPressure: number;
    status: OperationalStatus;
  };
}

export const JOINT_CONFIG: JointMetadata[] = [
  { id: 'J1', name: 'Base Rotation', axis: 'Yaw (Y-axis)', min: -170, max: 170, description: 'High-torque harmonic drive turntable pedestal' },
  { id: 'J2', name: 'Shoulder Pitch', axis: 'Pitch (X-axis)', min: -60, max: 120, description: 'Dual cast-alloy elevation arm actuator' },
  { id: 'J3', name: 'Elbow Swivel', axis: 'Pitch (X-axis)', min: -90, max: 135, description: 'Planetary gear counter-balanced boom linkage' },
  { id: 'J4', name: 'Forearm Roll', axis: 'Roll (Z-axis)', min: -180, max: 180, description: 'High-speed axial rotation forearm cylinder' },
  { id: 'J5', name: 'Wrist Pitch', axis: 'Pitch (X-axis)', min: -115, max: 115, description: 'Ultra-precision optical-encoder wrist flex' },
  { id: 'J6', name: 'Tool Flange / Gripper', axis: 'Roll (Z-axis)', min: -360, max: 360, description: 'Modular tool flange with pneumatic parallel gripper' },
];

export interface TelemetryState {
  // Operational Metrics
  operationalStatus: OperationalStatus;
  productionMode: ProductionMode;
  isMuted: boolean;
  temperature: number; // in °C
  vibration: number; // in mm/s RMS
  rpm: number;
  hydraulicPressureBar: number;
  payloadKg: number;
  cycleCount: number;
  uptimeSeconds: number;

  // Enterprise OEE & Factory KPIs
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  powerDrawKw: number;
  energyCostPerHour: number;
  carbonKgPerHour: number;
  partsPerHour: number;
  sparklineHistory: SparklinePoint[];

  // Multi-Perspective Camera Rig
  activeCamera: CameraPreset;
  setCameraPreset: (cam: CameraPreset) => void;

  // Maintenance CMMS Work Orders
  activeWorkOrder: WorkOrder | null;
  isWorkOrderModalOpen: boolean;
  generateWorkOrder: () => WorkOrder;
  closeWorkOrderModal: () => void;
  openWorkOrderModal: () => void;
  exportIncidentLog: () => void;

  // Kinematics (degrees)
  jointAngles: [number, number, number, number, number, number];
  gripperClosed: boolean;
  cyclePhaseName: string;
  pickPlaceTimer: number;

  // Interactivity
  explodedView: boolean;
  selectedJointIndex: number | null;
  isEmergencyStopped: boolean;

  // AI Diagnostics
  diagnosticResult: DiagnosticResult | null;
  isDiagnosing: boolean;
  diagnosticError: string | null;

  // Actions
  toggleProductionMode: () => void;
  toggleMute: () => void;
  toggleExplodedView: () => void;
  setExplodedView: (val: boolean) => void;
  setSelectedJointIndex: (index: number | null) => void;
  setOperationalStatus: (status: OperationalStatus) => void;
  cycleStatus: () => void;
  emergencyStop: () => void;
  resetTelemetry: () => void;
  setManualJointAngle: (index: number, angle: number) => void;
  runDiagnostics: () => Promise<void>;
  tick: () => void;
}

const DEFAULT_ANGLES: [number, number, number, number, number, number] = [0, 25, -45, 0, 30, 0];

// Pick & Place Keyframes: [J1, J2, J3, J4, J5, J6]
interface Keyframe {
  time: number;
  angles: [number, number, number, number, number, number];
  gripperClosed: boolean;
  phaseName: string;
}

const PICK_PLACE_KEYFRAMES: Keyframe[] = [
  { time: 0.0, angles: [0, 20, -35, 0, 25, 0], gripperClosed: false, phaseName: 'Standby / Home' },
  { time: 2.0, angles: [48, 42, -18, 10, 28, 0], gripperClosed: false, phaseName: 'Approach Feed Bin' },
  { time: 4.0, angles: [48, 62, 8, 18, 16, 0], gripperClosed: true, phaseName: 'Grip Workpiece (Pneumatic Clamp)' },
  { time: 5.8, angles: [48, 22, -38, 10, 32, 0], gripperClosed: true, phaseName: 'Lift from Feed Tray' },
  { time: 8.4, angles: [-48, 28, -28, -12, 28, 90], gripperClosed: true, phaseName: 'Transfer to Conveyor Line' },
  { time: 10.4, angles: [-48, 58, 10, -18, 18, 90], gripperClosed: false, phaseName: 'Release onto Conveyor Belt' },
  { time: 12.2, angles: [0, 20, -35, 0, 25, 0], gripperClosed: false, phaseName: 'Return to Standby' },
];

function interpolateKeyframes(time: number): { angles: [number, number, number, number, number, number]; gripperClosed: boolean; phaseName: string } {
  const cycleDuration = 12.2;
  const loopTime = time % cycleDuration;

  let prev = PICK_PLACE_KEYFRAMES[0];
  let next = PICK_PLACE_KEYFRAMES[1];

  for (let i = 0; i < PICK_PLACE_KEYFRAMES.length - 1; i++) {
    if (loopTime >= PICK_PLACE_KEYFRAMES[i].time && loopTime <= PICK_PLACE_KEYFRAMES[i + 1].time) {
      prev = PICK_PLACE_KEYFRAMES[i];
      next = PICK_PLACE_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = next.time - prev.time;
  const progress = span > 0 ? (loopTime - prev.time) / span : 0;
  // Smooth cubic ease-in-out
  const ease = progress * progress * (3 - 2 * progress);

  const angles: [number, number, number, number, number, number] = [
    +(prev.angles[0] + (next.angles[0] - prev.angles[0]) * ease).toFixed(1),
    +(prev.angles[1] + (next.angles[1] - prev.angles[1]) * ease).toFixed(1),
    +(prev.angles[2] + (next.angles[2] - prev.angles[2]) * ease).toFixed(1),
    +(prev.angles[3] + (next.angles[3] - prev.angles[3]) * ease).toFixed(1),
    +(prev.angles[4] + (next.angles[4] - prev.angles[4]) * ease).toFixed(1),
    +(prev.angles[5] + (next.angles[5] - prev.angles[5]) * ease).toFixed(1),
  ];

  return {
    angles,
    gripperClosed: prev.gripperClosed,
    phaseName: prev.phaseName,
  };
}

// Generate 30 initial sparkline points for instant visual fidelity
const INITIAL_SPARKLINES: SparklinePoint[] = Array.from({ length: 30 }, (_, i) => ({
  time: Date.now() - (29 - i) * 1000,
  temp: +(46.5 + Math.sin(i * 0.4) * 2.2 + (Math.random() - 0.5) * 0.8).toFixed(1),
  vibe: +(1.1 + Math.sin(i * 0.7) * 0.2 + (Math.random() - 0.5) * 0.15).toFixed(2),
}));

let tickCounter = 0;

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  operationalStatus: 'NORMAL',
  productionMode: 'AUTO_PICK_PLACE',
  isMuted: false,
  temperature: 48.2,
  vibration: 1.15,
  rpm: 1450,
  hydraulicPressureBar: 140.5,
  payloadKg: 12.8,
  cycleCount: 14820,
  uptimeSeconds: 52128, // ~14h 28m

  // Enterprise OEE & Factory KPIs
  oee: 94.8,
  availability: 98.2,
  performance: 97.0,
  quality: 99.5,
  powerDrawKw: 3.42,
  energyCostPerHour: 0.479,
  carbonKgPerHour: 1.317,
  partsPerHour: 295,
  sparklineHistory: INITIAL_SPARKLINES,

  // Camera Rig
  activeCamera: 'CAM_01_ISOMETRIC',
  setCameraPreset: (cam: CameraPreset) => {
    audioEngine.playClickSound();
    set({ activeCamera: cam });
  },

  // CMMS Work Orders
  activeWorkOrder: null,
  isWorkOrderModalOpen: false,

  generateWorkOrder: () => {
    audioEngine.playClickSound();
    const state = get();
    const randId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `WO-2026-${randId}`;

    let urgency: 'P1-CRITICAL' | 'P2-WARNING' | 'P3-ROUTINE' = 'P3-ROUTINE';
    let sku = 'SKU: LUBRICANT-SYNTH-ISO-VG-220 (5L)';
    let skuDesc = 'High-viscosity synthetic harmonic drive lubricant & gear seals';

    if (state.isEmergencyStopped || state.operationalStatus === 'CRITICAL' || state.temperature > 85) {
      urgency = 'P1-CRITICAL';
      sku = 'SKU: BEARING-NSK-6204ZZ-DEEP-GROOVE';
      skuDesc = 'Precision radial ball bearing assembly (J2/J3 Elevation Pivot)';
    } else if (state.operationalStatus === 'WARNING' || state.vibration > 3.0) {
      urgency = 'P2-WARNING';
      sku = 'SKU: SEAL-KIT-FESTO-DNC-40-PPV';
      skuDesc = 'Pneumatic cylinder seal replacement kit (End-Effector Parallel Clamp)';
    }

    const newOrder: WorkOrder = {
      id: orderId,
      createdAt: new Date().toLocaleTimeString() + ' | ' + new Date().toLocaleDateString(),
      urgency,
      status: 'DISPATCHED',
      sku,
      skuDescription: skuDesc,
      assignedEngineer: 'Automated Dispatch -> Shift Team Beta (Lead: Eng. Marcus Vance)',
      workcellLocation: 'Facility 4, Workcell Alpha-06, Sector G-12',
      diagnosisSummary: state.diagnosticResult?.diagnosis || 'Routine preventative inspection scheduled.',
      rootCause: state.diagnosticResult?.rootCause || 'Telemetry within baseline tolerance. Preventative cycle.',
      recommendedAction: state.diagnosticResult?.recommendedAction || 'Execute visual harmonic drive alignment check.',
      engineSource: state.diagnosticResult?.engineSource || 'Nebius Nemotron',
      telemetrySnapshot: {
        coreTemp: state.temperature,
        vibration: state.vibration,
        rpm: state.rpm,
        hydraulicPressure: state.hydraulicPressureBar,
        status: state.operationalStatus,
      },
    };

    set({ activeWorkOrder: newOrder, isWorkOrderModalOpen: true });
    return newOrder;
  },

  closeWorkOrderModal: () => set({ isWorkOrderModalOpen: false }),
  openWorkOrderModal: () => {
    if (!get().activeWorkOrder) {
      get().generateWorkOrder();
    } else {
      set({ isWorkOrderModalOpen: true });
    }
  },

  exportIncidentLog: () => {
    audioEngine.playClickSound();
    const state = get();
    const report = {
      reportType: 'AURA-OPS ENTERPRISE INDUSTRIAL DIGITAL TWIN TELEMETRY INCIDENT LOG',
      exportTimestamp: new Date().toISOString(),
      plantLocation: 'Facility 4, Workcell Alpha-06, Sector G-12',
      equipment: {
        model: 'AURA-OPS 6-AXIS INDUSTRIAL ROBOTIC ARM TWIN',
        serialNumber: 'TWIN-06-2026-X89',
        uptimeSeconds: Math.round(state.uptimeSeconds),
        cycleCount: state.cycleCount,
      },
      kpiMetrics: {
        oeePercent: state.oee,
        availabilityPercent: state.availability,
        performancePercent: state.performance,
        qualityPercent: state.quality,
        powerDrawKw: state.powerDrawKw,
        partsPerHour: state.partsPerHour,
      },
      telemetrySnapshot: {
        operationalStatus: state.operationalStatus,
        isEmergencyStopped: state.isEmergencyStopped,
        temperatureC: state.temperature,
        vibrationMmS: state.vibration,
        spindleRpm: state.rpm,
        hydraulicPressureBar: state.hydraulicPressureBar,
        activePayloadKg: state.payloadKg,
        jointAnglesDeg: {
          J1: state.jointAngles[0],
          J2: state.jointAngles[1],
          J3: state.jointAngles[2],
          J4: state.jointAngles[3],
          J5: state.jointAngles[4],
          J6: state.jointAngles[5],
        },
      },
      aiDiagnosis: state.diagnosticResult,
      cmmsWorkOrder: state.activeWorkOrder,
      recentSparklineTrends: state.sparklineHistory.slice(-20),
    };

    if (typeof window !== 'undefined') {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AURA_OPS_INCIDENT_REPORT_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  jointAngles: [...DEFAULT_ANGLES],
  gripperClosed: false,
  cyclePhaseName: 'Standby / Home',
  pickPlaceTimer: 0,

  explodedView: false,
  selectedJointIndex: null,
  isEmergencyStopped: false,

  // Initialized baseline diagnostic state
  diagnosticResult: {
    diagnosis: 'Kinematic alignment nominal. All 6 axes within 99.8% precision tolerance.',
    rootCause: 'Harmonic drives and optical encoders operating within factory baseline.',
    recommendedAction: 'Continue standard automated manufacturing cycle.',
    severity: 'NORMAL',
    engineSource: 'Nebius Nemotron',
    latencyMs: 148,
    timestamp: Date.now(),
  },
  isDiagnosing: false,
  diagnosticError: null,

  toggleProductionMode: () => {
    const nextMode: ProductionMode = get().productionMode === 'AUTO_PICK_PLACE' ? 'HARMONIC' : 'AUTO_PICK_PLACE';
    audioEngine.playClickSound();
    audioEngine.playMotorWhir(0.3, 300);
    set({
      productionMode: nextMode,
      pickPlaceTimer: 0,
      cyclePhaseName: nextMode === 'AUTO_PICK_PLACE' ? 'Approach Feed Bin' : 'Harmonic Oscillation',
    });
  },

  toggleMute: () => {
    const muted = audioEngine.toggleMute();
    set({ isMuted: muted });
  },

  toggleExplodedView: () => {
    const nextExploded = !get().explodedView;
    audioEngine.playMechanicalDisassembly(nextExploded);
    set({ explodedView: nextExploded });
  },

  setExplodedView: (val: boolean) => {
    audioEngine.playMechanicalDisassembly(val);
    set({ explodedView: val });
  },

  setSelectedJointIndex: (index: number | null) => {
    audioEngine.playClickSound();
    set({ selectedJointIndex: index });
  },

  setOperationalStatus: (status: OperationalStatus) => {
    audioEngine.playClickSound();
    let baseTemp = 48.0;
    let baseVibe = 1.1;
    if (status === 'WARNING') {
      baseTemp = 74.0;
      baseVibe = 3.2;
    } else if (status === 'CRITICAL') {
      baseTemp = 96.0;
      baseVibe = 6.4;
    }
    set({ operationalStatus: status, temperature: baseTemp, vibration: baseVibe });

    if (status === 'WARNING' || status === 'CRITICAL') {
      setTimeout(() => {
        get().runDiagnostics();
      }, 100);
    }
  },

  cycleStatus: () => {
    const current = get().operationalStatus;
    const next: Record<OperationalStatus, OperationalStatus> = {
      NORMAL: 'WARNING',
      WARNING: 'CRITICAL',
      CRITICAL: 'NORMAL',
    };
    get().setOperationalStatus(next[current]);
  },

  emergencyStop: () => {
    const stopped = get().isEmergencyStopped;
    if (stopped) {
      // Release E-Stop
      audioEngine.stopEmergencyAlarm();
      audioEngine.playClickSound();
      set({
        isEmergencyStopped: false,
        operationalStatus: 'NORMAL',
        rpm: 1450,
        temperature: 51.0,
        vibration: 1.2,
      });
      setTimeout(() => get().runDiagnostics(), 100);
    } else {
      // Trigger E-Stop siren
      audioEngine.playEmergencyAlarm();
      set({
        isEmergencyStopped: true,
        operationalStatus: 'CRITICAL',
        rpm: 0,
        vibration: 0.04,
        temperature: Math.min(get().temperature + 4.5, 98.0),
      });
      setTimeout(() => get().runDiagnostics(), 100);
    }
  },

  resetTelemetry: () => {
    audioEngine.stopEmergencyAlarm();
    audioEngine.playClickSound();
    set({
      operationalStatus: 'NORMAL',
      temperature: 46.5,
      vibration: 1.05,
      rpm: 1440,
      hydraulicPressureBar: 138.0,
      isEmergencyStopped: false,
      explodedView: false,
      selectedJointIndex: null,
      jointAngles: [...DEFAULT_ANGLES],
      gripperClosed: false,
      pickPlaceTimer: 0,
      diagnosticResult: {
        diagnosis: 'Kinematic alignment nominal. All 6 axes within 99.8% precision tolerance.',
        rootCause: 'System calibrated. Telemetry baselines re-established.',
        recommendedAction: 'Engage routine workcell automation program.',
        severity: 'NORMAL',
        engineSource: 'Nebius Nemotron',
        latencyMs: 110,
        timestamp: Date.now(),
      },
    });
  },

  setManualJointAngle: (index: number, angle: number) => {
    const current = [...get().jointAngles] as [number, number, number, number, number, number];
    if (index >= 0 && index < current.length) {
      current[index] = angle;
      set({ jointAngles: current });
    }
  },

  runDiagnostics: async () => {
    if (get().isDiagnosing) return;
    audioEngine.playClickSound();
    set({ isDiagnosing: true, diagnosticError: null });
    const s = get();

    try {
      const res = await fetch('/api/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coreTemp: s.temperature,
          vibration: s.vibration,
          spindleRpm: s.rpm,
          status: s.operationalStatus,
          jointAngles: {
            J1: s.jointAngles[0],
            J2: s.jointAngles[1],
            J3: s.jointAngles[2],
            J4: s.jointAngles[3],
            J5: s.jointAngles[4],
            J6: s.jointAngles[5],
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Diagnostic service responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      set({
        diagnosticResult: { ...data, timestamp: Date.now() },
        isDiagnosing: false,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Diagnostic execution failed';
      set({
        diagnosticError: errorMsg,
        isDiagnosing: false,
      });
    }
  },

  tick: () => {
    const state = get();
    tickCounter++;

    if (state.isEmergencyStopped) {
      set((s) => ({
        temperature: Math.max(24, +(s.temperature * 0.998).toFixed(1)),
        vibration: +(Math.random() * 0.03).toFixed(2),
        availability: 42.0,
        oee: +((42.0 * s.performance * s.quality) / 10000).toFixed(1),
        powerDrawKw: 0.45,
      }));
      return;
    }

    const t = (performance.now ? performance.now() : Date.now()) * 0.001;

    let nextAngles = state.jointAngles;
    let nextGripperClosed = state.gripperClosed;
    let nextPhaseName = state.cyclePhaseName;
    let nextCycleCount = state.cycleCount;

    if (state.productionMode === 'AUTO_PICK_PLACE') {
      const nextTimer = state.pickPlaceTimer + 0.1;
      const interp = interpolateKeyframes(nextTimer);
      nextAngles = interp.angles;
      nextPhaseName = interp.phaseName;

      // Play audio on gripper grasp / release state transitions
      if (interp.gripperClosed !== state.gripperClosed) {
        audioEngine.playPneumaticHiss(0.25);
        audioEngine.playMotorWhir(0.35, interp.gripperClosed ? 260 : 200);
      }
      nextGripperClosed = interp.gripperClosed;

      // Cycle completion detection
      if (Math.floor(nextTimer / 12.2) > Math.floor(state.pickPlaceTimer / 12.2)) {
        nextCycleCount += 1;
      }

      // Intermittent servo hum during key motions
      if (Math.round(nextTimer * 10) % 25 === 0) {
        audioEngine.playMotorWhir(0.4, 220 + (Math.sin(nextTimer) * 40));
      }

      set({ pickPlaceTimer: nextTimer });
    } else {
      // Harmonic Oscillation
      const j1 = +(Math.sin(t * 0.8) * 45).toFixed(1);
      const j2 = +(20 + Math.sin(t * 1.1) * 35).toFixed(1);
      const j3 = +(-35 + Math.cos(t * 0.9) * 40).toFixed(1);
      const j4 = +(Math.sin(t * 1.3) * 60).toFixed(1);
      const j5 = +(25 + Math.cos(t * 1.5) * 30).toFixed(1);
      const j6 = +((t * 90) % 360 - 180).toFixed(1);
      nextAngles = [j1, j2, j3, j4, j5, j6];
      nextPhaseName = 'Continuous Harmonic Sweep';
    }

    // Dynamic temperature and vibration fluctuations
    let tempTarget = 48;
    let vibeTarget = 1.1;
    let rpmTarget = 1450;

    if (state.operationalStatus === 'WARNING') {
      tempTarget = 74;
      vibeTarget = 3.2;
      rpmTarget = 1680;
    } else if (state.operationalStatus === 'CRITICAL') {
      tempTarget = 95;
      vibeTarget = 6.2;
      rpmTarget = 1890;
    }

    const noiseTemp = (Math.random() - 0.5) * 0.6;
    const noiseVibe = (Math.random() - 0.5) * 0.25;
    const noiseRpm = (Math.random() - 0.5) * 12;

    const nextTemp = +(tempTarget + noiseTemp + Math.sin(t * 0.2) * 2.5).toFixed(1);
    const nextVibe = +(Math.max(0.1, vibeTarget + noiseVibe + Math.sin(t * 3.0) * 0.2)).toFixed(2);
    const nextRpm = Math.round(rpmTarget + noiseRpm + Math.sin(t * 0.5) * 30);
    const nextPressure = +(138 + Math.sin(t * 0.4) * 4 + (Math.random() - 0.5) * 0.8).toFixed(1);

    // Calculate OEE KPIs
    const avail = state.isEmergencyStopped ? 45.0 : state.operationalStatus === 'CRITICAL' ? 79.2 : state.operationalStatus === 'WARNING' ? 92.5 : 98.4;
    const perf = state.productionMode === 'AUTO_PICK_PLACE' ? 97.4 : 94.0;
    const qual = state.operationalStatus === 'CRITICAL' ? 88.5 : state.operationalStatus === 'WARNING' ? 96.0 : 99.6;
    const nextOee = +((avail * perf * qual) / 10000).toFixed(1);

    // Dynamic Energy metrics
    const powerDraw = +(2.8 + (nextRpm / 1500) * 0.75 + (nextVibe / 5) * 0.35).toFixed(2);
    const costPerHour = +(powerDraw * 0.14).toFixed(3);
    const carbonPerHour = +(powerDraw * 0.385).toFixed(3);
    const partsPerHour = Math.round(290 + (nextRpm / 1500) * 12);

    // Append to sparkline history every 5 ticks (500ms)
    let nextSparklines = state.sparklineHistory;
    if (tickCounter % 5 === 0) {
      const newPt: SparklinePoint = { time: Date.now(), temp: nextTemp, vibe: nextVibe };
      nextSparklines = [...state.sparklineHistory.slice(-29), newPt];
    }

    set((s) => ({
      jointAngles: nextAngles,
      gripperClosed: nextGripperClosed,
      cyclePhaseName: nextPhaseName,
      cycleCount: nextCycleCount,
      temperature: nextTemp,
      vibration: nextVibe,
      rpm: nextRpm,
      hydraulicPressureBar: nextPressure,
      uptimeSeconds: s.uptimeSeconds + 0.1,
      oee: nextOee,
      availability: avail,
      performance: perf,
      quality: qual,
      powerDrawKw: powerDraw,
      energyCostPerHour: costPerHour,
      carbonKgPerHour: carbonPerHour,
      partsPerHour: partsPerHour,
      sparklineHistory: nextSparklines,
    }));
  },
}));

// Ticker singleton runner for real-time 100ms updates
let globalTickerStarted = false;
export const initTelemetryTicker = () => {
  if (typeof window === 'undefined' || globalTickerStarted) return;
  globalTickerStarted = true;
  setInterval(() => {
    useTelemetryStore.getState().tick();
  }, 100);
};
