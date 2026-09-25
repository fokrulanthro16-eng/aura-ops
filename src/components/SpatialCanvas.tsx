'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { XR, Controllers, Hands } from '@react-three/xr';
import { RoboticArm } from './RoboticArm';
import { TelemetryHUD } from './TelemetryHUD';
import { CAMERA_PRESETS, useTelemetryStore, initTelemetryTicker } from '@/store/useTelemetryStore';

// Bright, multi-point industrial lighting rig ensuring full specular reflections on metallic surfaces
const SpatialLighting: React.FC = () => {
  const operationalStatus = useTelemetryStore((s) => s.operationalStatus);
  const isEmergencyStopped = useTelemetryStore((s) => s.isEmergencyStopped);

  const statusColor = isEmergencyStopped || operationalStatus === 'CRITICAL'
    ? '#ef4444'
    : operationalStatus === 'WARNING'
    ? '#f59e0b'
    : '#00f0ff';

  return (
    <>
      {/* High-lumen Industrial Facility Ambient Light */}
      <ambientLight intensity={0.75} color="#e2e8f0" />

      {/* Main Overhead Key Light with Crisp Shadows */}
      <directionalLight
        position={[3.5, 6.5, 3.5]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0001}
      />

      {/* Secondary Front Fill Light */}
      <directionalLight position={[-3.5, 4.0, 2.5]} intensity={1.2} color="#94a3b8" />

      {/* Rear Rim Light for Sharp Metallic Silhouette Highlights */}
      <directionalLight position={[0, 5.0, -4.0]} intensity={1.0} color="#cbd5e1" />

      {/* Dynamic Status Workcell Spotlight directly overhead */}
      <spotLight
        position={[0, 4.5, 1.5]}
        target-position={[0, 0.8, 0]}
        intensity={2.2}
        angle={0.65}
        penumbra={0.4}
        color="#ffffff"
      />

      {/* Dynamic Colored Status Volumetric Point Light */}
      <pointLight
        position={[0, 2.2, 0]}
        intensity={2.0}
        distance={6}
        color={statusColor}
        decay={2}
      />

      {/* Floor Ring Indicator Light */}
      <pointLight
        position={[0, 0.15, 0]}
        intensity={1.0}
        distance={2.5}
        color={statusColor}
      />
    </>
  );
};

// High-Tech Industrial Safety Perimeter Floor & Spatial Grid
const IndustrialWorkcellFloor: React.FC = () => {
  const operationalStatus = useTelemetryStore((s) => s.operationalStatus);
  const statusColor = operationalStatus === 'CRITICAL'
    ? '#ef4444'
    : operationalStatus === 'WARNING'
    ? '#f59e0b'
    : '#00f0ff';

  return (
    <group position={[0, 0, 0]}>
      {/* Spatial Grid at y = 0.001 */}
      <Grid
        position={[0, 0.001, 0]}
        args={[16, 16]}
        cellSize={0.25}
        cellThickness={0.7}
        cellColor="#334155"
        sectionSize={1.0}
        sectionThickness={1.4}
        sectionColor={statusColor}
        fadeDistance={12}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* Industrial Foundation Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.5}
        />
      </mesh>

      {/* Primary OSHA Safety Workcell Perimeter Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.7, 1.78, 64]} />
        <meshBasicMaterial color={statusColor} opacity={0.7} transparent />
      </mesh>

      {/* Secondary Outer Caution Boundary Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[2.4, 2.45, 64]} />
        <meshBasicMaterial color="#64748b" opacity={0.5} transparent />
      </mesh>

      {/* Realistic Floor Contact Shadows (Computed once for maximum Meta Quest mobile fillrate) */}
      <ContactShadows
        position={[0, 0.003, 0]}
        opacity={0.8}
        scale={4.5}
        blur={1.6}
        far={3}
        frames={1}
        color="#000000"
      />
    </group>
  );
};

// Factory Floor Realism: Feed Station, Conveyor Track, & OSHA Barrier Cage
const IndustrialFactoryEnvironment: React.FC = () => {
  const operationalStatus = useTelemetryStore((s) => s.operationalStatus);
  const isEmergencyStopped = useTelemetryStore((s) => s.isEmergencyStopped);

  const laserColor = isEmergencyStopped || operationalStatus === 'CRITICAL'
    ? '#ef4444'
    : operationalStatus === 'WARNING'
    ? '#f59e0b'
    : '#00f0ff';

  return (
    <group>
      {/* 1. Incoming Feed Station (Pickup Bay at x = 0.92, z = 0.82) */}
      <group position={[0.92, 0, 0.82]} rotation={[0, -0.65, 0]}>
        {/* Steel Stand Pedestal */}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.32, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Fixture Plate / Tray Bed */}
        <mesh position={[0, 0.33, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.04, 0.52]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Guide Rails */}
        <mesh position={[-0.2, 0.37, 0]} castShadow>
          <boxGeometry args={[0.02, 0.05, 0.52]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0.2, 0.37, 0]} castShadow>
          <boxGeometry args={[0.02, 0.05, 0.52]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Status Indicator LED (Feed Ready) */}
        <mesh position={[0, 0.36, -0.24]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2} />
        </mesh>

        {/* Awaiting Raw Workpieces sitting on feeder queue */}
        <mesh position={[0, 0.42, 0.12]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.14, 24]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.42, -0.1]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.14, 24]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.85} />
        </mesh>
      </group>

      {/* 2. Outgoing Motorized Conveyor Line (Discharge Bay at x = -1.05, z = 0.75) */}
      <group position={[-1.05, 0, 0.75]} rotation={[0, 0.65, 0]}>
        {/* Conveyor Aluminum Bed */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.06, 1.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Conveyor Support Legs */}
        {[-0.7, 0, 0.7].map((z, idx) => (
          <group key={`leg-${idx}`} position={[0, 0.13, z]}>
            <mesh position={[-0.19, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.26, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0.19, 0, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.26, 16]} />
              <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* Conveyor Belt with Industrial Hazard Border Strip */}
        <mesh position={[0, 0.315, 0]} receiveShadow>
          <boxGeometry args={[0.36, 0.01, 1.76]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} metalness={0.2} />
        </mesh>

        {/* End Steel Rollers */}
        <mesh position={[0, 0.28, 0.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.44, 24]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.15} metalness={0.95} />
        </mesh>
        <mesh position={[0, 0.28, -0.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.44, 24]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.15} metalness={0.95} />
        </mesh>

        {/* Optical Sensor Gate on conveyor */}
        <group position={[0, 0.38, 0.3]}>
          <mesh position={[-0.2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0.2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* Laser beam */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.002, 0.002, 0.4, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>

        {/* Discharged Finished Workpieces progressing down the line */}
        <mesh position={[0, 0.39, -0.3]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.14, 24]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.39, 0.6]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.14, 24]} />
          <meshStandardMaterial color="#eab308" roughness={0.2} metalness={0.85} />
        </mesh>
      </group>

      {/* 3. OSHA Safety Barrier Perimeter Enclosure & Corner Bollards */}
      <group>
        {/* 4 Corner Bollards / Safety Columns */}
        {[
          [2.1, 2.1],
          [-2.1, 2.1],
          [2.1, -2.1],
          [-2.1, -2.1],
        ].map(([x, z], idx) => (
          <group key={`bollard-${idx}`} position={[x, 0, z]}>
            {/* Base Foot Plate */}
            <mesh position={[0, 0.01, 0]}>
              <boxGeometry args={[0.16, 0.02, 0.16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} />
            </mesh>
            {/* Safety Yellow/Black Column */}
            <mesh position={[0, 0.65, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.3, 16]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.6} />
            </mesh>
            {/* Top Warning Strobe Beacon */}
            <mesh position={[0, 1.34, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.08, 16]} />
              <meshStandardMaterial
                color={laserColor}
                emissive={laserColor}
                emissiveIntensity={1.8}
              />
            </mesh>
          </group>
        ))}

        {/* Acrylic Safety Glass Panes along back and sides (leaving front open for VR operator) */}
        {/* Back Wall (z = -2.1) */}
        <mesh position={[0, 0.65, -2.1]}>
          <boxGeometry args={[4.2, 1.2, 0.01]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.12}
            roughness={0.1}
            transmission={0.8}
            metalness={0.1}
          />
        </mesh>
        {/* Top & Bottom Yellow Header/Footer Rails */}
        <mesh position={[0, 1.25, -2.1]}>
          <boxGeometry args={[4.2, 0.04, 0.04]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.06, -2.1]}>
          <boxGeometry args={[4.2, 0.04, 0.04]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>

        {/* Right Wall (x = 2.1) */}
        <mesh position={[2.1, 0.65, 0]}>
          <boxGeometry args={[0.01, 1.2, 4.2]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.12}
            roughness={0.1}
            transmission={0.8}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[2.1, 1.25, 0]}>
          <boxGeometry args={[0.04, 0.04, 4.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>

        {/* Left Wall (x = -2.1) */}
        <mesh position={[-2.1, 0.65, 0]}>
          <boxGeometry args={[0.01, 1.2, 4.2]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.12}
            roughness={0.1}
            transmission={0.8}
            metalness={0.1}
          />
        </mesh>
        <mesh position={[-2.1, 1.25, 0]}>
          <boxGeometry args={[0.04, 0.04, 4.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>

        {/* Active Laser Perimeter Safety Tripwire (Front Entry Gate at z = 2.1) */}
        <mesh position={[0, 0.35, 2.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.003, 0.003, 4.2, 8]} />
          <meshBasicMaterial color={laserColor} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.85, 2.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.003, 0.003, 4.2, 8]} />
          <meshBasicMaterial color={laserColor} transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// Camera Controller smoothly interpolating position and lookAt on preset selection
const CameraController: React.FC<{
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}> = ({ controlsRef }) => {
  const activeCamera = useTelemetryStore((s) => s.activeCamera);
  const preset = CAMERA_PRESETS[activeCamera] || CAMERA_PRESETS.CAM_01_ISOMETRIC;
  const isTransitioning = useRef(true);
  const prevCamera = useRef(activeCamera);

  useEffect(() => {
    if (prevCamera.current !== activeCamera) {
      prevCamera.current = activeCamera;
      isTransitioning.current = true;
    }
  }, [activeCamera]);

  useFrame((state, delta) => {
    if (!isTransitioning.current) return;

    const targetPos = new THREE.Vector3(...preset.position);
    const targetLookAt = new THREE.Vector3(...preset.target);

    state.camera.position.lerp(targetPos, Math.min(1, delta * 4.2));

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt, Math.min(1, delta * 4.2));
      controlsRef.current.update();
    }

    if (state.camera.position.distanceTo(targetPos) < 0.03) {
      isTransitioning.current = false;
    }
  });

  return null;
};

export const SpatialCanvas: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    initTelemetryTicker();
  }, []);

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <Canvas
        shadows
        dpr={typeof window !== 'undefined' && /Oculus|Quest/i.test(navigator.userAgent) ? 1 : [1, 1.5]}
        camera={{ position: [0, 2.0, 4.4], fov: 48 }}
        className="w-full h-full bg-slate-950"
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
      >
        {/* WebXR Session Support for Meta Quest 3 / Pro */}
        <XR>
          {/* WebXR Hand Tracking & 6DoF Controllers */}
          <Hands />
          <Controllers />

          {/* Camera Smooth Transition Rig */}
          <CameraController controlsRef={controlsRef} />

          {/* Precision Industrial Spatial Lighting Rig */}
          <SpatialLighting />

          {/* Workcell Ground Plane & Grid */}
          <IndustrialWorkcellFloor />

          {/* Factory Floor Realism: Feed Chute, Conveyor Track, & OSHA Barrier */}
          <IndustrialFactoryEnvironment />

          {/* 3D Digital Twin & Spatial Telemetry HUD */}
          <Suspense fallback={null}>
            <RoboticArm />
            <TelemetryHUD />
          </Suspense>

          {/* Desktop Inspection Controls: orbit, pan, zoom */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            minDistance={0.8}
            maxDistance={12}
            target={[0, 1.0, 0]}
            enableDamping
            dampingFactor={0.05}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI / 2 - 0.02}
          />
        </XR>
      </Canvas>
    </div>
  );
};
