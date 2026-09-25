'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Interactive } from '@react-three/xr';
import { useTelemetryStore } from '@/store/useTelemetryStore';

// Dynamic status colors
const STATUS_COLORS = {
  NORMAL: {
    accent: '#00f0ff',
    glow: '#00d0ea',
    emissiveIntensity: 1.2,
  },
  WARNING: {
    accent: '#f59e0b',
    glow: '#d97706',
    emissiveIntensity: 1.6,
  },
  CRITICAL: {
    accent: '#ef4444',
    glow: '#dc2626',
    emissiveIntensity: 2.2,
  },
};

// 3D Holographic AI Scanner Ring (Animated laser scan traveling up and down the arm)
const AIScannerRing: React.FC = () => {
  const isDiagnosing = useTelemetryStore((s) => s.isDiagnosing);
  const diagnosticResult = useTelemetryStore((s) => s.diagnosticResult);
  const ringRef = useRef<THREE.Group>(null);
  const [completeFlash, setCompleteFlash] = useState(false);

  useEffect(() => {
    if (!isDiagnosing && diagnosticResult) {
      setCompleteFlash(true);
      const timer = setTimeout(() => setCompleteFlash(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [isDiagnosing, diagnosticResult]);

  useFrame((state) => {
    if (!ringRef.current) return;
    if (isDiagnosing) {
      const t = state.clock.getElapsedTime();
      // Smooth travel along arm vertical height (y = 0.2 to y = 2.3)
      ringRef.current.position.y = 1.25 + Math.sin(t * 4.2) * 1.05;
      ringRef.current.rotation.y += 0.06;
    } else if (completeFlash) {
      ringRef.current.position.y = 1.25;
      ringRef.current.rotation.y += 0.02;
    }
  });

  if (!isDiagnosing && !completeFlash) return null;

  const severityColor =
    diagnosticResult?.severity === 'CRITICAL'
      ? '#ef4444'
      : diagnosticResult?.severity === 'WARNING'
      ? '#f59e0b'
      : '#10b981';

  const activeColor = isDiagnosing ? '#00f0ff' : severityColor;

  return (
    <group ref={ringRef} position={[0, 1.25, 0]}>
      {/* Outer Holographic Laser Scan Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.64, 48]} />
        <meshStandardMaterial
          color={activeColor}
          emissive={activeColor}
          emissiveIntensity={2.8}
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Internal Laser Grid Reticle Sheet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.55, 32]} />
        <meshBasicMaterial
          color={activeColor}
          transparent
          opacity={isDiagnosing ? 0.22 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Volumetric Scan Light Sheet Ring */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 32, 1, true]} />
        <meshBasicMaterial
          color={activeColor}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point Light tracking the scanner position */}
      <pointLight color={activeColor} intensity={2.2} distance={2.5} />
    </group>
  );
};

export const RoboticArm: React.FC = () => {
  // Mobile GPU optimization: fine-grained selectors isolate RoboticArm from 100ms numeric ticks
  const operationalStatus = useTelemetryStore((s) => s.operationalStatus);
  const gripperClosed = useTelemetryStore((s) => s.gripperClosed);
  const productionMode = useTelemetryStore((s) => s.productionMode);
  const explodedView = useTelemetryStore((s) => s.explodedView);
  const toggleExplodedView = useTelemetryStore((s) => s.toggleExplodedView);
  const selectedJointIndex = useTelemetryStore((s) => s.selectedJointIndex);
  const setSelectedJointIndex = useTelemetryStore((s) => s.setSelectedJointIndex);

  const [hoveredJoint, setHoveredJoint] = useState<number | null>(null);

  // Groups for hierarchical kinematics (J1 - J6)
  const j1Ref = useRef<THREE.Group>(null);
  const j2Ref = useRef<THREE.Group>(null);
  const j3Ref = useRef<THREE.Group>(null);
  const j4Ref = useRef<THREE.Group>(null);
  const j5Ref = useRef<THREE.Group>(null);
  const j6Ref = useRef<THREE.Group>(null);

  // Finger groups for animated pneumatic clamping
  const leftFingerRef = useRef<THREE.Group>(null);
  const rightFingerRef = useRef<THREE.Group>(null);

  // Groups for exploded view disassembly translation offsets
  const explodeBaseRef = useRef<THREE.Group>(null);
  const explodeShoulderRef = useRef<THREE.Group>(null);
  const explodeElbowRef = useRef<THREE.Group>(null);
  const explodeForearmRef = useRef<THREE.Group>(null);
  const explodeWristRef = useRef<THREE.Group>(null);
  const explodeGripperRef = useRef<THREE.Group>(null);

  // Status color evaluation
  const statusCfg = STATUS_COLORS[operationalStatus] || STATUS_COLORS.NORMAL;
  const currentAccentColor = useMemo(() => new THREE.Color(statusCfg.accent), [statusCfg.accent]);

  // High-contrast, bright industrial materials
  const primaryAlloy = useMemo(() => new THREE.Color('#e2e8f0'), []); // Clean industrial safety white/light titanium
  const darkChassis = useMemo(() => new THREE.Color('#334155'), []);  // Deep slate structural steel
  const brightSteel = useMemo(() => new THREE.Color('#94a3b8'), []);  // Polished chrome/steel
  const safetyOrange = useMemo(() => new THREE.Color('#f97316'), []); // Industrial safety orange accent
  const hazardBlack = useMemo(() => new THREE.Color('#0f172a'), []);  // Contrast trim
  const workpieceGold = useMemo(() => new THREE.Color('#f59e0b'), []); // Machined brass/titanium workpiece

  // Frame loop: smooth kinematic lerping reading directly from store state (0 React re-renders)
  useFrame((_, delta) => {
    const lerpSpeed = Math.min(delta * 8, 1);
    const explodeLerp = Math.min(delta * 5, 1);
    const targetExplode = explodedView ? 1 : 0;
    const degToRad = THREE.MathUtils.degToRad;

    // Directly read latest kinematics without triggering component re-render
    const angles = useTelemetryStore.getState().jointAngles;

    // 1. Hierarchical Joint Kinematics
    if (j1Ref.current) {
      const targetJ1 = degToRad(angles[0]);
      j1Ref.current.rotation.y = THREE.MathUtils.lerp(j1Ref.current.rotation.y, targetJ1, lerpSpeed);
    }
    if (j2Ref.current) {
      const targetJ2 = degToRad(angles[1]);
      j2Ref.current.rotation.x = THREE.MathUtils.lerp(j2Ref.current.rotation.x, targetJ2, lerpSpeed);
    }
    if (j3Ref.current) {
      const targetJ3 = degToRad(angles[2]);
      j3Ref.current.rotation.x = THREE.MathUtils.lerp(j3Ref.current.rotation.x, targetJ3, lerpSpeed);
    }
    if (j4Ref.current) {
      const targetJ4 = degToRad(angles[3]);
      j4Ref.current.rotation.y = THREE.MathUtils.lerp(j4Ref.current.rotation.y, targetJ4, lerpSpeed);
    }
    if (j5Ref.current) {
      const targetJ5 = degToRad(angles[4]);
      j5Ref.current.rotation.x = THREE.MathUtils.lerp(j5Ref.current.rotation.x, targetJ5, lerpSpeed);
    }
    if (j6Ref.current) {
      const targetJ6 = degToRad(angles[5]);
      j6Ref.current.rotation.z = THREE.MathUtils.lerp(j6Ref.current.rotation.z, targetJ6, lerpSpeed);
    }

    // 2. Dynamic Pneumatic Gripper Finger Clamping
    const targetOffset = gripperClosed ? 0.038 : 0.065;
    if (leftFingerRef.current) {
      leftFingerRef.current.position.x = THREE.MathUtils.lerp(leftFingerRef.current.position.x, -targetOffset, delta * 12);
    }
    if (rightFingerRef.current) {
      rightFingerRef.current.position.x = THREE.MathUtils.lerp(rightFingerRef.current.position.x, targetOffset, delta * 12);
    }

    // 3. Smooth Exploded View Disassembly Offsets
    if (explodeBaseRef.current) {
      explodeBaseRef.current.position.y = THREE.MathUtils.lerp(explodeBaseRef.current.position.y, 0, explodeLerp);
    }
    if (explodeShoulderRef.current) {
      explodeShoulderRef.current.position.y = THREE.MathUtils.lerp(explodeShoulderRef.current.position.y, targetExplode * 0.28, explodeLerp);
    }
    if (explodeElbowRef.current) {
      explodeElbowRef.current.position.y = THREE.MathUtils.lerp(explodeElbowRef.current.position.y, targetExplode * 0.35, explodeLerp);
      explodeElbowRef.current.position.z = THREE.MathUtils.lerp(explodeElbowRef.current.position.z, targetExplode * -0.22, explodeLerp);
    }
    if (explodeForearmRef.current) {
      explodeForearmRef.current.position.y = THREE.MathUtils.lerp(explodeForearmRef.current.position.y, targetExplode * 0.38, explodeLerp);
      explodeForearmRef.current.position.z = THREE.MathUtils.lerp(explodeForearmRef.current.position.z, targetExplode * 0.25, explodeLerp);
    }
    if (explodeWristRef.current) {
      explodeWristRef.current.position.y = THREE.MathUtils.lerp(explodeWristRef.current.position.y, targetExplode * 0.42, explodeLerp);
      explodeWristRef.current.position.x = THREE.MathUtils.lerp(explodeWristRef.current.position.x, targetExplode * 0.2, explodeLerp);
    }
    if (explodeGripperRef.current) {
      explodeGripperRef.current.position.y = THREE.MathUtils.lerp(explodeGripperRef.current.position.y, targetExplode * 0.48, explodeLerp);
    }
  });

  const handleComponentSelect = (jointIndex: number) => {
    setSelectedJointIndex(selectedJointIndex === jointIndex ? null : jointIndex);
  };

  const getEmissiveIntensity = (jointIndex: number) => {
    if (selectedJointIndex === jointIndex) return 2.5;
    if (hoveredJoint === jointIndex) return 1.8;
    return statusCfg.emissiveIntensity;
  };

  return (
    <group position={[0, 0, 0]} scale={[0.82, 0.82, 0.82]}>
      {/* 3D Holographic AI Scanner Ring */}
      <AIScannerRing />

      {/* ========================================================
          PICKUP & DROP STATIONS (Auto Pick & Place Workcell)
      ======================================================== */}
      {productionMode === 'AUTO_PICK_PLACE' && (
        <group>
          {/* Pickup Station (Right Front quadrant) */}
          <group position={[0.82, 0, 0.74]}>
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.24, 24]} />
              <meshStandardMaterial color={darkChassis} roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.241, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.2, 32]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
            {/* Workpiece on pickup station when waiting */}
            {!gripperClosed && (
              <mesh position={[0, 0.31, 0]} castShadow>
                <cylinderGeometry args={[0.045, 0.045, 0.14, 24]} />
                <meshStandardMaterial color={workpieceGold} roughness={0.2} metalness={0.9} />
              </mesh>
            )}
          </group>

          {/* Assembly Drop Station (Left Front quadrant) */}
          <group position={[-0.82, 0, 0.74]}>
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.22, 0.26, 0.24, 24]} />
              <meshStandardMaterial color={darkChassis} roughness={0.4} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.241, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.2, 32]} />
              <meshBasicMaterial color="#00f0ff" />
            </mesh>
          </group>
        </group>
      )}

      {/* ========================================================
          AXIS 1: BASE MOUNTING PEDESTAL (Ground y = 0.0)
      ======================================================== */}
      <group ref={explodeBaseRef}>
        <Interactive
          onSelect={() => handleComponentSelect(0)}
          onHover={() => setHoveredJoint(0)}
          onBlur={() => setHoveredJoint(null)}
        >
          <group
            onClick={(e) => {
              e.stopPropagation();
              handleComponentSelect(0);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredJoint(0);
            }}
            onPointerOut={() => setHoveredJoint(null)}
          >
            {/* Ground Flange Plinth */}
            <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.65, 0.1, 32]} />
              <meshStandardMaterial
                color={darkChassis}
                roughness={0.35}
                metalness={0.65}
              />
            </mesh>

            {/* Industrial Floor Perimeter Bolts */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <mesh
                  key={`bolt-${i}`}
                  position={[Math.cos(angle) * 0.52, 0.11, Math.sin(angle) * 0.52]}
                  castShadow
                >
                  <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
                  <meshStandardMaterial color={brightSteel} roughness={0.2} metalness={0.8} />
                </mesh>
              );
            })}

            {/* Primary Base Column Casting */}
            <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.48, 0.24, 32]} />
              <meshStandardMaterial
                color={primaryAlloy}
                roughness={0.25}
                metalness={0.45}
              />
            </mesh>

            {/* Base Safety Ring Glow Indicator */}
            <mesh position={[0, 0.35, 0]}>
              <torusGeometry args={[0.425, 0.02, 16, 48]} />
              <meshStandardMaterial
                color={currentAccentColor}
                emissive={currentAccentColor}
                emissiveIntensity={getEmissiveIntensity(0)}
                toneMapped={false}
              />
            </mesh>

            {/* High-visibility Hazard Band */}
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.425, 0.45, 0.08, 32]} />
              <meshStandardMaterial color={safetyOrange} roughness={0.4} />
            </mesh>
          </group>
        </Interactive>
      </group>

      {/* ROTATING YAW TURNTABLE (Kinematic J1) */}
      <group ref={j1Ref} position={[0, 0.36, 0]}>
        <Interactive
          onSelect={() => handleComponentSelect(0)}
          onHover={() => setHoveredJoint(0)}
          onBlur={() => setHoveredJoint(null)}
        >
          <group
            onClick={(e) => {
              e.stopPropagation();
              handleComponentSelect(0);
            }}
          >
            {/* Turntable Disc */}
            <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.38, 0.41, 0.12, 32]} />
              <meshStandardMaterial color={darkChassis} roughness={0.3} metalness={0.7} />
            </mesh>

            {/* Side Servo Actuator Housing */}
            <mesh position={[0.26, 0.08, -0.1]} castShadow>
              <boxGeometry args={[0.12, 0.16, 0.14]} />
              <meshStandardMaterial color={safetyOrange} roughness={0.35} metalness={0.3} />
            </mesh>
          </group>
        </Interactive>

        {/* ========================================================
            AXIS 2: SHOULDER PITCH ASSEMBLY (J2)
        ======================================================== */}
        <group ref={explodeShoulderRef} position={[0, 0.12, 0]}>
          <Interactive
            onSelect={() => handleComponentSelect(1)}
            onHover={() => setHoveredJoint(1)}
            onBlur={() => setHoveredJoint(null)}
          >
            <group
              onClick={(e) => {
                e.stopPropagation();
                handleComponentSelect(1);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredJoint(1);
              }}
              onPointerOut={() => setHoveredJoint(null)}
            >
              {/* Dual Cast Bracket Arms */}
              <mesh position={[-0.18, 0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.5, 0.28]} />
                <meshStandardMaterial color={primaryAlloy} roughness={0.25} metalness={0.4} />
              </mesh>
              <mesh position={[0.18, 0.25, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.12, 0.5, 0.28]} />
                <meshStandardMaterial color={primaryAlloy} roughness={0.25} metalness={0.4} />
              </mesh>

              {/* Shoulder Pivot Hub */}
              <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.16, 0.16, 0.46, 32]} />
                <meshStandardMaterial color={darkChassis} roughness={0.25} metalness={0.7} />
              </mesh>

              {/* Shoulder Emissive Glow Trim Rings */}
              <mesh position={[-0.24, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.165, 0.015, 16, 32]} />
                <meshStandardMaterial
                  color={currentAccentColor}
                  emissive={currentAccentColor}
                  emissiveIntensity={getEmissiveIntensity(1)}
                  toneMapped={false}
                />
              </mesh>
              <mesh position={[0.24, 0.45, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[0.165, 0.015, 16, 32]} />
                <meshStandardMaterial
                  color={currentAccentColor}
                  emissive={currentAccentColor}
                  emissiveIntensity={getEmissiveIntensity(1)}
                  toneMapped={false}
                />
              </mesh>

              {/* Counter-weight Hydraulic Cylinder */}
              <mesh position={[0, 0.18, -0.22]} rotation={[0.4, 0, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.35, 24]} />
                <meshStandardMaterial color={brightSteel} roughness={0.15} metalness={0.9} />
              </mesh>
            </group>
          </Interactive>

          {/* ROTATING SHOULDER PITCH (Kinematic J2) */}
          <group ref={j2Ref} position={[0, 0.45, 0]}>
            <Interactive
              onSelect={() => handleComponentSelect(1)}
              onHover={() => setHoveredJoint(1)}
              onBlur={() => setHoveredJoint(null)}
            >
              <group
                onClick={(e) => {
                  e.stopPropagation();
                  handleComponentSelect(1);
                }}
              >
                {/* Structural Boom Arm */}
                <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.22, 0.84, 0.2]} />
                  <meshStandardMaterial color={primaryAlloy} roughness={0.25} metalness={0.4} />
                </mesh>

                {/* Dark Contrast Inset Plate */}
                <mesh position={[0, 0.42, 0.105]} castShadow>
                  <boxGeometry args={[0.16, 0.74, 0.01]} />
                  <meshStandardMaterial color={darkChassis} roughness={0.5} metalness={0.3} />
                </mesh>

                {/* High-Visibility Hazard Marker */}
                <mesh position={[0, 0.75, 0.106]}>
                  <planeGeometry args={[0.16, 0.06]} />
                  <meshStandardMaterial color={safetyOrange} roughness={0.3} />
                </mesh>

                {/* Vertical Status Glow Bar */}
                <mesh position={[0.115, 0.42, 0]}>
                  <boxGeometry args={[0.015, 0.7, 0.04]} />
                  <meshStandardMaterial
                    color={currentAccentColor}
                    emissive={currentAccentColor}
                    emissiveIntensity={getEmissiveIntensity(1)}
                    toneMapped={false}
                  />
                </mesh>
              </group>
            </Interactive>

            {/* ========================================================
                AXIS 3: ELBOW SWIVEL JOINT (J3)
            ======================================================== */}
            <group ref={explodeElbowRef} position={[0, 0.84, 0]}>
              <Interactive
                onSelect={() => handleComponentSelect(2)}
                onHover={() => setHoveredJoint(2)}
                onBlur={() => setHoveredJoint(null)}
              >
                <group
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComponentSelect(2);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredJoint(2);
                  }}
                  onPointerOut={() => setHoveredJoint(null)}
                >
                  {/* Elbow Rotary Pivot Casing */}
                  <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.14, 0.14, 0.36, 32]} />
                    <meshStandardMaterial color={darkChassis} roughness={0.25} metalness={0.7} />
                  </mesh>

                  {/* Servomotor Side Housing */}
                  <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.11, 0.11, 0.08, 24]} />
                    <meshStandardMaterial color={safetyOrange} roughness={0.3} metalness={0.4} />
                  </mesh>

                  {/* Elbow Emissive Ring */}
                  <mesh position={[0.19, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[0.112, 0.012, 16, 32]} />
                    <meshStandardMaterial
                      color={currentAccentColor}
                      emissive={currentAccentColor}
                      emissiveIntensity={getEmissiveIntensity(2)}
                      toneMapped={false}
                    />
                  </mesh>
                </group>
              </Interactive>

              {/* ROTATING ELBOW PITCH (Kinematic J3) */}
              <group ref={j3Ref} position={[0, 0, 0]}>
                <Interactive
                  onSelect={() => handleComponentSelect(2)}
                  onHover={() => setHoveredJoint(2)}
                  onBlur={() => setHoveredJoint(null)}
                >
                  <group
                    onClick={(e) => {
                      e.stopPropagation();
                      handleComponentSelect(2);
                    }}
                  >
                    {/* Forearm Boom Link */}
                    <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                      <boxGeometry args={[0.18, 0.7, 0.16]} />
                      <meshStandardMaterial color={primaryAlloy} roughness={0.25} metalness={0.4} />
                    </mesh>

                    {/* Hydraulic Line Routing Conduit */}
                    <mesh position={[-0.11, 0.35, 0]} castShadow>
                      <cylinderGeometry args={[0.018, 0.018, 0.65, 12]} />
                      <meshStandardMaterial color={brightSteel} roughness={0.2} metalness={0.9} />
                    </mesh>
                  </group>
                </Interactive>

                {/* ========================================================
                    AXIS 4: FOREARM ROLL ASSEMBLY (J4)
                ======================================================== */}
                <group ref={explodeForearmRef} position={[0, 0.7, 0]}>
                  <Interactive
                    onSelect={() => handleComponentSelect(3)}
                    onHover={() => setHoveredJoint(3)}
                    onBlur={() => setHoveredJoint(null)}
                  >
                    <group
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComponentSelect(3);
                      }}
                      onPointerOver={(e) => {
                        e.stopPropagation();
                        setHoveredJoint(3);
                      }}
                      onPointerOut={() => setHoveredJoint(null)}
                    >
                      {/* Planetary Gear Housing Hub */}
                      <mesh position={[0, 0.06, 0]} castShadow>
                        <cylinderGeometry args={[0.12, 0.12, 0.12, 32]} />
                        <meshStandardMaterial color={darkChassis} roughness={0.25} metalness={0.7} />
                      </mesh>

                      {/* Status Glow Ring */}
                      <mesh position={[0, 0.12, 0]}>
                        <torusGeometry args={[0.122, 0.012, 16, 32]} />
                        <meshStandardMaterial
                          color={currentAccentColor}
                          emissive={currentAccentColor}
                          emissiveIntensity={getEmissiveIntensity(3)}
                          toneMapped={false}
                        />
                      </mesh>
                    </group>
                  </Interactive>

                  {/* ROTATING FOREARM ROLL (Kinematic J4) */}
                  <group ref={j4Ref} position={[0, 0.12, 0]}>
                    <Interactive
                      onSelect={() => handleComponentSelect(3)}
                      onHover={() => setHoveredJoint(3)}
                      onBlur={() => setHoveredJoint(null)}
                    >
                      <group
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComponentSelect(3);
                        }}
                      >
                        {/* Cylindrical Forearm Barrel */}
                        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
                          <cylinderGeometry args={[0.09, 0.11, 0.44, 32]} />
                          <meshStandardMaterial color={primaryAlloy} roughness={0.25} metalness={0.4} />
                        </mesh>

                        {/* Longitudinal Heatsink Fins */}
                        {Array.from({ length: 4 }).map((_, i) => (
                          <mesh
                            key={`fin-${i}`}
                            position={[0, 0.22, 0]}
                            rotation={[0, (i * Math.PI) / 2, 0]}
                          >
                            <boxGeometry args={[0.02, 0.38, 0.2]} />
                            <meshStandardMaterial color={safetyOrange} roughness={0.3} metalness={0.3} />
                          </mesh>
                        ))}
                      </group>
                    </Interactive>

                    {/* ========================================================
                        AXIS 5: WRIST PITCH / YAW GIMBAL (J5)
                    ======================================================== */}
                    <group ref={explodeWristRef} position={[0, 0.44, 0]}>
                      <Interactive
                        onSelect={() => handleComponentSelect(4)}
                        onHover={() => setHoveredJoint(4)}
                        onBlur={() => setHoveredJoint(null)}
                      >
                        <group
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComponentSelect(4);
                          }}
                          onPointerOver={(e) => {
                            e.stopPropagation();
                            setHoveredJoint(4);
                          }}
                          onPointerOut={() => setHoveredJoint(null)}
                        >
                          {/* Wrist Fork Gimbal Base */}
                          <mesh position={[0, 0.08, 0]} castShadow>
                            <boxGeometry args={[0.14, 0.16, 0.12]} />
                            <meshStandardMaterial color={darkChassis} roughness={0.25} metalness={0.7} />
                          </mesh>

                          {/* Optical Sensor Housing */}
                          <mesh position={[0, 0.08, 0.065]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.02, 0.02, 0.02, 16]} />
                            <meshStandardMaterial
                              color="#0284c7"
                              emissive="#0284c7"
                              emissiveIntensity={1.2}
                            />
                          </mesh>
                        </group>
                      </Interactive>

                      {/* ROTATING WRIST PITCH (Kinematic J5) */}
                      <group ref={j5Ref} position={[0, 0.16, 0]}>
                        <Interactive
                          onSelect={() => handleComponentSelect(4)}
                          onHover={() => setHoveredJoint(4)}
                          onBlur={() => setHoveredJoint(null)}
                        >
                          <group
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComponentSelect(4);
                            }}
                          >
                            {/* Wrist Transverse Pivot Pin */}
                            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                              <cylinderGeometry args={[0.06, 0.06, 0.16, 24]} />
                              <meshStandardMaterial color={brightSteel} roughness={0.2} metalness={0.9} />
                            </mesh>

                            {/* Wrist Status Glow Ring */}
                            <mesh position={[0.085, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                              <torusGeometry args={[0.062, 0.01, 16, 24]} />
                              <meshStandardMaterial
                                color={currentAccentColor}
                                emissive={currentAccentColor}
                                emissiveIntensity={getEmissiveIntensity(4)}
                                toneMapped={false}
                              />
                            </mesh>
                          </group>
                        </Interactive>

                        {/* ========================================================
                            AXIS 6: TOOL FLANGE & PNEUMATIC PARALLEL GRIPPER (J6)
                        ======================================================== */}
                        <group ref={explodeGripperRef} position={[0, 0.08, 0]}>
                          <group ref={j6Ref}>
                            <Interactive
                              onSelect={() => handleComponentSelect(5)}
                              onHover={() => setHoveredJoint(5)}
                              onBlur={() => setHoveredJoint(null)}
                            >
                              <group
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleComponentSelect(5);
                                }}
                                onPointerOver={(e) => {
                                  e.stopPropagation();
                                  setHoveredJoint(5);
                                }}
                                onPointerOut={() => setHoveredJoint(null)}
                              >
                                {/* Tool Flange Disc */}
                                <mesh position={[0, 0.04, 0]} castShadow>
                                  <cylinderGeometry args={[0.075, 0.075, 0.04, 32]} />
                                  <meshStandardMaterial color={brightSteel} roughness={0.15} metalness={0.95} />
                                </mesh>

                                {/* Gripper Body Block */}
                                <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                                  <boxGeometry args={[0.18, 0.12, 0.1]} />
                                  <meshStandardMaterial color={primaryAlloy} roughness={0.25} metalness={0.4} />
                                </mesh>

                                {/* Pneumatic Piston Cylinder */}
                                <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                                  <cylinderGeometry args={[0.04, 0.04, 0.2, 24]} />
                                  <meshStandardMaterial color={darkChassis} roughness={0.25} metalness={0.7} />
                                </mesh>

                                {/* Left Parallel Gripper Finger */}
                                <group ref={leftFingerRef} position={[-0.065, 0.18, 0]}>
                                  <mesh castShadow>
                                    <boxGeometry args={[0.024, 0.14, 0.035]} />
                                    <meshStandardMaterial color={brightSteel} roughness={0.2} metalness={0.9} />
                                  </mesh>
                                  <mesh position={[0.014, -0.01, 0]}>
                                    <boxGeometry args={[0.005, 0.08, 0.028]} />
                                    <meshStandardMaterial color={hazardBlack} roughness={0.9} />
                                  </mesh>
                                </group>

                                {/* Right Parallel Gripper Finger */}
                                <group ref={rightFingerRef} position={[0.065, 0.18, 0]}>
                                  <mesh castShadow>
                                    <boxGeometry args={[0.024, 0.14, 0.035]} />
                                    <meshStandardMaterial color={brightSteel} roughness={0.2} metalness={0.9} />
                                  </mesh>
                                  <mesh position={[-0.014, -0.01, 0]}>
                                    <boxGeometry args={[0.005, 0.08, 0.028]} />
                                    <meshStandardMaterial color={hazardBlack} roughness={0.9} />
                                  </mesh>
                                </group>

                                {/* Active Workpiece being grasped and moved */}
                                {gripperClosed && (
                                  <mesh position={[0, 0.22, 0]} castShadow>
                                    <cylinderGeometry args={[0.045, 0.045, 0.14, 24]} />
                                    <meshStandardMaterial color={workpieceGold} roughness={0.2} metalness={0.9} />
                                  </mesh>
                                )}

                                {/* Optical Tool Emitter Laser Beam */}
                                <mesh position={[0, 0.18, 0]}>
                                  <cylinderGeometry args={[0.008, 0.008, 0.01, 16]} />
                                  <meshStandardMaterial
                                    color={currentAccentColor}
                                    emissive={currentAccentColor}
                                    emissiveIntensity={getEmissiveIntensity(5)}
                                  />
                                </mesh>

                                {/* Tool Flange Status Glow Ring */}
                                <mesh position={[0, 0.07, 0]}>
                                  <torusGeometry args={[0.076, 0.008, 16, 32]} />
                                  <meshStandardMaterial
                                    color={currentAccentColor}
                                    emissive={currentAccentColor}
                                    emissiveIntensity={getEmissiveIntensity(5)}
                                    toneMapped={false}
                                  />
                                </mesh>
                              </group>
                            </Interactive>
                          </group>
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Disassembly Leader Visual Rings when Exploded */}
      {explodedView && (
        <group>
          {[0.22, 0.82, 1.45, 1.95, 2.35].map((y, idx) => (
            <mesh key={`ring-${idx}`} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.28, 0.29, 32]} />
              <meshBasicMaterial color={statusCfg.accent} transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* Base Workcell Interactive Touch Ring (Pinch or click to explode) */}
      <Interactive onSelect={toggleExplodedView}>
        <mesh
          position={[0, 0.005, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            toggleExplodedView();
          }}
        >
          <ringGeometry args={[0.7, 0.82, 48]} />
          <meshStandardMaterial
            color={currentAccentColor}
            emissive={currentAccentColor}
            emissiveIntensity={explodedView ? 1.8 : 0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Interactive>
    </group>
  );
};
