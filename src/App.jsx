// App.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { MapControls, Html } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";

const LAT_TO_METERS = 111320;
const API_POLL_INTERVAL = 5000; // Live API refresh rate (5 seconds)

// --- Head Office Coordinates (polygon) ---
const HEAD_OFFICE_POLYGON = [
  [28.50921721347462, 77.2876475691699],
  [28.509125822340106, 77.28766336700072],
  [28.509129292890968, 77.28761334053647],
  [28.509039058531517, 77.28761860648007],
  [28.509036744828975, 77.28754751624142],
  [28.508996255026346, 77.2875448832696],
  [28.508995098174594, 77.28756989650174],
  [28.508910647963845, 77.28757252947354],
  [28.508902549994893, 77.28748432491817],
  [28.50884470734014, 77.28748300843061],
  [28.508676963465497, 77.28731844769297],
  [28.508670022332243, 77.28724209150724],
  [28.50859714042292, 77.28723945853544],
  [28.508587885573693, 77.28714467155055],
  [28.508600610991166, 77.28709727805813],
  [28.508543925028732, 77.28709332860042],
  [28.508541611315344, 77.28699854161553],
  [28.50849070960772, 77.28699590864375],
  [28.508488395893163, 77.28689453922934],
  [28.50902401946127, 77.28687215896902],
  [28.509030960569564, 77.28697616135523],
  [28.508850491605273, 77.28698406027061],
  [28.50885743272499, 77.28722497719053],
  [28.508907177402953, 77.28726973771117],
  [28.509207958676942, 77.28725788933805]
];

// --- 4 Warehouses (unchanged) ---
const WAREHOUSE_DATA = [
  {
    id: "Warehouse 1",
    polygon: [
      [28.51143341203824, 77.29014792543707],
      [28.511447553531475, 77.29061060646951],
      [28.50887469321554, 77.29073212892841],
      [28.50886142486985, 77.29025147014725],
      [28.51143341203824, 77.29014792543707]
    ]
  },
  {
    id: "Warehouse 2",
    polygon: [
      [28.51112807640633, 77.28930776832516],
      [28.51114576715341, 77.2897859105682],
      [28.50960493713407, 77.28986465016293],
      [28.509580039693272, 77.28937354130709],
      [28.51112807640633, 77.28930776832516]
    ]
  },
  {
    id: "Warehouse 3",
    polygon: [
      [28.50948198269312, 77.29158820098095],
      [28.509540076766502, 77.2919518104223],
      [28.508237102003246, 77.29219264264968],
      [28.508187306470095, 77.29182903320833],
      [28.50948198269312, 77.29158820098095]
    ]
  },
  {
    id: "Warehouse 4",
    polygon: [
      [28.516129077394567, 77.28667217921567],
      [28.51617385678954, 77.28779736584238],
      [28.51584625972401, 77.28780541246903],
      [28.515805015417023, 77.28667754363342],
      [28.516129077394567, 77.28667217921567]
    ]
  }
];

// --- 4-Line Railway Track Coordinates ---
const TRACK_COORDS = [
  [28.50798029741757, 77.2861993278382],
  [28.511441251081667, 77.28608144845934],
  [28.513226522607233, 77.28598437130985],
  [28.514676652635337, 77.28588036009819],
  [28.516528890591463, 77.28581795337986],
  [28.517899769428844, 77.28680259289459],
  [28.519014737755104, 77.28747519872812],
  [28.52097656595973, 77.28848757455816],
  [28.5227129362258, 77.28815473873708],
  [28.520793788465724, 77.28893135584076],
  [28.51889897656675, 77.28863319036364],
  [28.516778696540648, 77.28838356336682]
];

// --- Crane Coordinates ---
const CRANE_COORDS = [
  { lat: 28.508020512511646, lng: 77.28626664099272, type: 'yellow' },
  { lat: 28.51023423558485, lng: 77.2861962934262, type: 'orange' },
  { lat: 28.510471828319627, lng: 77.28618627929005, type: 'orange' },
  { lat: 28.513893598879548, lng: 77.2870393486428, type: 'yellow' },
  { lat: 28.513437787133046, lng: 77.28773232686511, type: 'orange' },
  { lat: 28.51020237705503, lan: 77.28787513782136, type: "orange" }
];

// --- Helper Functions ---
function calculateCenter(slots, warehouses) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  slots.forEach(slot => { slot.polygon.forEach(([lat, lng]) => { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }); });
  warehouses.forEach(wh => { wh.polygon.forEach(([lat, lng]) => { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }); });
  if (minLat === Infinity) return { lat: 28.510, lng: 77.290 };
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

const CameraZoomHandler = ({ zoomAction, setZoomAction }) => {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (zoomAction && controls) {
      const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
      const zoomFactor = zoomAction === 'in' ? 0.7 : 1.4;
      camera.position.copy(controls.target).add(direction.multiplyScalar(zoomFactor));
      controls.update();
      setZoomAction(null);
    }
  }, [zoomAction, camera, controls, setZoomAction]);
  return null;
};

// --- PRE-COMPUTE GEOMETRIES (Optimized for 500+ containers) ---
const geo40ft = new THREE.BoxGeometry(12.2, 2.6, 2.4);
const geo20ft = new THREE.BoxGeometry(6.1, 2.6, 2.4);
const edges40ft = new THREE.EdgesGeometry(geo40ft);
const edges20ft = new THREE.EdgesGeometry(geo20ft);

// --- Component: Placed Container ---
const Container3D = ({ data, isDark, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const geometry = data.is40 ? geo40ft : geo20ft;
  const edgeGeo = data.is40 ? edges40ft : edges20ft;

  const baseColor = isDark ? "#6B7280" : "#9CA3AF";
  const hoverColor = isDark ? "#9CA3AF" : "#D1D5DB";

  return (
    <mesh
      position={[data.x, data.y, data.z]}
      rotation={[0, -data.angle, 0]}
      castShadow
      receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(data); }}
      geometry={geometry}
    >
      <meshStandardMaterial color={hovered ? hoverColor : baseColor} roughness={0.6} metalness={0.4} />
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color={isDark ? "#374151" : "#4B5563"} />
      </lineSegments>
    </mesh>
  );
};

// --- Component: Gantry Crane ---
const Crane3D = ({ lat, lng, type, center, isDark }) => {
  const lngScale = Math.cos((center.lat * Math.PI) / 200);
  const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
  const z = -(lat - center.lat) * LAT_TO_METERS;

  const isYellow = type === 'yellow';
  const craneColor = isYellow ? "#FACC15" : "#EA580C";
  const darkMetal = isDark ? "#1F2937" : "#374151";

  return (
    <group position={[x, 0, z]} rotation={[0, 0, 0]}>
      <mesh position={[-12, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 3, 10]} /><meshStandardMaterial color={darkMetal} roughness={0.8} /></mesh>
      <mesh position={[12, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 3, 10]} /><meshStandardMaterial color={darkMetal} roughness={0.8} /></mesh>
      <mesh position={[-12, 13, 0]} castShadow receiveShadow><boxGeometry args={[3, 20, 3]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[12, 13, 0]} castShadow receiveShadow><boxGeometry args={[3, 20, 3]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
      {isYellow ? (
        <>
          <mesh position={[0, 24, -1.5]} castShadow receiveShadow><boxGeometry args={[34, 3, 1.5]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
          <mesh position={[0, 24, 1.5]} castShadow receiveShadow><boxGeometry args={[34, 3, 1.5]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
        </>
      ) : (
        <mesh position={[0, 24, 0]} castShadow receiveShadow><boxGeometry args={[34, 3, 4.5]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
      )}
      <mesh position={[0, 26.5, 0]} castShadow receiveShadow><boxGeometry args={[6, 3, 5]} /><meshStandardMaterial color={craneColor} /></mesh>
      <mesh position={[-2, 17, 0]}><cylinderGeometry args={[0.05, 0.05, 12]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[2, 17, 0]}><cylinderGeometry args={[0.05, 0.05, 12]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[0, 11, 0]} castShadow receiveShadow><boxGeometry args={[8, 1, 3]} /><meshStandardMaterial color={darkMetal} /></mesh>
    </group>
  );
};

// --- Component: Railway Track ---
const TrackSegment = ({ cx, cz, len, angle, isDark }) => {
  const trackCenters = [-6, -2, 2, 6];
  const gaugeHalf = 1.676 / 2;
  const railW = 0.15;

  const poleSpacing = 40;
  const numPoles = Math.floor(len / poleSpacing);
  const poles = [];
  for (let k = 0; k <= numPoles; k++) { poles.push(-len / 2 + (k * poleSpacing)); }
  const signalColors = [true, false, true, false];

  return (
    <group position={[cx, 0.05, cz]} rotation={[0, angle, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[20, 0.4, len]} /><meshStandardMaterial color={isDark ? "#3F3F46" : "#D4D4D8"} roughness={0.9} /></mesh>
      {trackCenters.map((tc, idx) => (
        <group key={`track-lines-${idx}`}>
          <mesh position={[tc - gaugeHalf, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[railW, 0.2, len]} /><meshStandardMaterial color={isDark ? "#9CA3AF" : "#6B7280"} metalness={0.8} roughness={0.2} /></mesh>
          <mesh position={[tc + gaugeHalf, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[railW, 0.2, len]} /><meshStandardMaterial color={isDark ? "#9CA3AF" : "#6B7280"} metalness={0.8} roughness={0.2} /></mesh>
          <mesh position={[tc, 9.5, 0]}><boxGeometry args={[0.05, 0.05, len]} /><meshStandardMaterial color="#1F2937" metalness={0.9} roughness={0.1} /></mesh>
        </group>
      ))}
      {poles.map((zOffset, i) => (
        <group key={`pole-${i}`} position={[0, 0, zOffset]}>
          <mesh position={[-9.5, 5, 0]} castShadow><boxGeometry args={[0.4, 10, 0.4]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.5} /></mesh>
          <mesh position={[-0.5, 9.5, 0]} castShadow><boxGeometry args={[18.4, 0.3, 0.4]} /><meshStandardMaterial color="#334155" metalness={0.7} /></mesh>
          {trackCenters.map((trackCenter, idx) => (
            <group key={`signal-${idx}`} position={[trackCenter, 8.5, 0.2]}>
              <mesh castShadow><boxGeometry args={[0.7, 1.4, 0.5]} /><meshStandardMaterial color="#111827" /></mesh>
              <mesh position={[0, 0, 0.26]}><circleGeometry args={[0.25, 16]} /><meshStandardMaterial color={signalColors[idx] ? "#10B981" : "#EF4444"} emissive={signalColors[idx] ? "#10B981" : "#EF4444"} emissiveIntensity={3} /></mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

// --- Component: Wall Decorations for Warehouse (unchanged) ---
const WallDecorations = ({ segment }) => {
  const { midX, midZ, nx, nz, len } = segment;
  const rotationY = Math.atan2(nx, nz);
  const yRotation = [0, rotationY, 0];
  const depthOffset = 0.15;
  const pos = [midX + nx * depthOffset, 0, midZ + nz * depthOffset];

  const renderShutter = (offsetX) => (
    <group position={[offsetX, 4, 0]} key={`shutter-${offsetX}`}>
      <mesh castShadow receiveShadow><boxGeometry args={[4, 8, 0.1]} /><meshStandardMaterial color="#9CA3AF" roughness={0.6} metalness={0.5} /></mesh>
      <mesh position={[-1, 1.5, 0.06]}><boxGeometry args={[1, 0.5, 0.05]} /><meshStandardMaterial color="#1F2937" /></mesh>
      <mesh position={[1, 1.5, 0.06]}><boxGeometry args={[1, 0.5, 0.05]} /><meshStandardMaterial color="#1F2937" /></mesh>
      <mesh position={[-2.5, -3.25, 0.5]} castShadow><cylinderGeometry args={[0.15, 0.15, 1.5, 12]} /><meshStandardMaterial color="#EAB308" roughness={0.4} /></mesh>
      <mesh position={[2.5, -3.25, 0.5]} castShadow><cylinderGeometry args={[0.15, 0.15, 1.5, 12]} /><meshStandardMaterial color="#EAB308" roughness={0.4} /></mesh>
    </group>
  );

  return (
    <group position={pos} rotation={yRotation}>
      {len > 18 && (<>{renderShutter(-3.5)}{renderShutter(3.5)}</>)}
      {len > 10 && len <= 18 && (<>{renderShutter(-2)}<mesh position={[3, 2.5, 0]} castShadow><boxGeometry args={[2, 5, 0.1]} /><meshStandardMaterial color="#4B5563" roughness={0.8} /></mesh></>)}
    </group>
  );
};

// --- Warehouse3D (unchanged) ---
const Warehouse3D = ({ data, center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const { shape, wallSegments } = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];

    data.polygon.forEach((coord, i) => {
      const [lat, lng] = coord;
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const y = (lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      points2D.push({ wx: x, wz: -y });
    });

    let cx = 0, cz = 0;
    points2D.forEach(p => { cx += p.wx; cz += p.wz; });
    cx /= points2D.length; cz /= points2D.length;

    const segments = [];
    for (let i = 0; i < points2D.length - 1; i++) {
      const p1 = points2D[i];
      const p2 = points2D[i + 1];
      const dx = p2.wx - p1.wx;
      const dz = p2.wz - p1.wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      const midX = (p1.wx + p2.wx) / 2;
      const midZ = (p1.wz + p2.wz) / 2;

      let nx = dz / len; let nz = -dx / len;
      if (nx * (midX - cx) + nz * (midZ - cz) < 0) { nx = -nx; nz = -nz; }
      segments.push({ midX, midZ, nx, nz, len });
    }
    return { shape: s, wallSegments: segments };
  }, [data, center]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} castShadow receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <extrudeGeometry args={[shape, { depth: 10, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" color={hovered ? (isDark ? "#94A3B8" : "#E2E8F0") : (isDark ? "#475569" : "#94A3B8")} roughness={0.7} metalness={0.3} />
        <meshStandardMaterial attach="material-1" color={hovered ? (isDark ? "#94A3B8" : "#E2E8F0") : (isDark ? "#64748B" : "#F1F5F9")} roughness={0.9} />
      </mesh>
      {wallSegments.map((segment, idx) => <WallDecorations key={`wall-detail-${idx}`} segment={segment} />)}
      {hovered && <Html position={[0, 15, 0]} center style={{ pointerEvents: "none" }}><div className={`tooltip-3d ${isDark ? 'dark' : 'light'}`}>{data.id}</div></Html>}
    </group>
  );
};

// --- NEW: Head Office Building with White Windows ---
const OfficeWallDecorations = ({ segment, isDark }) => {
  const { midX, midZ, nx, nz, len } = segment;
  const rotationY = Math.atan2(nx, nz);
  const yRotation = [0, rotationY, 0];
  const depthOffset = 0.15;
  const pos = [midX + nx * depthOffset, 0, midZ + nz * depthOffset];

  // White windows
  const glassColor = "#FFFFFF"; // White
  const frameColor = isDark ? "#1E293B" : "#475569";
  const gateColor = "#334155";

  const buildWindows = () => {
    const windows = [];
    const windowWidth = 2;
    const padding = 1;
    const numWindows = Math.floor(len / (windowWidth + padding)) - 1;
    const startX = -(numWindows * (windowWidth + padding)) / 2 + windowWidth / 2;

    for (let i = 0; i < numWindows; i++) {
      const offsetX = startX + i * (windowWidth + padding);
      // 4 floors: heights 2, 6, 10, 14
      [2, 6, 10, 14].forEach((h) => {
        windows.push(
          <group key={`win-${i}-${h}`} position={[offsetX, h, 0]}>
            <mesh castShadow><boxGeometry args={[windowWidth, 2.5, 0.1]} /><meshStandardMaterial color={frameColor} roughness={0.8} /></mesh>
            <mesh position={[0, 0, 0.06]}><boxGeometry args={[windowWidth - 0.2, 2.3, 0.05]} /><meshStandardMaterial color={glassColor} metalness={0.9} roughness={0.1} emissive={glassColor} emissiveIntensity={0.2} /></mesh>
          </group>
        );
      });
    }
    return windows;
  };

  return (
    <group position={pos} rotation={yRotation}>
      {/* Structural bands */}
      {[4, 8, 12].forEach(y => (
        <mesh key={`band-${y}`} position={[0, y, 0]} castShadow>
          <boxGeometry args={[len, 0.4, 0.2]} />
          <meshStandardMaterial color={frameColor} metalness={0.5} />
        </mesh>
      ))}

      {len > 15 ? (
        <>
          {buildWindows()}
          <group position={[0, 2, 0.1]}>
            <mesh castShadow><boxGeometry args={[6, 4, 0.2]} /><meshStandardMaterial color={frameColor} /></mesh>
            <mesh position={[-1.5, 0, 0.1]}><boxGeometry args={[2.5, 3.5, 0.1]} /><meshStandardMaterial color={gateColor} /></mesh>
            <mesh position={[1.5, 0, 0.1]}><boxGeometry args={[2.5, 3.5, 0.1]} /><meshStandardMaterial color={gateColor} /></mesh>
            <mesh position={[0, 2.2, 1.5]} castShadow><boxGeometry args={[7, 0.4, 3]} /><meshStandardMaterial color={frameColor} /></mesh>
          </group>
        </>
      ) : (
        buildWindows()
      )}
    </group>
  );
};

const NetworkTower = ({ cx, cz }) => (
  <group position={[cx, 16, cz]}>
    <mesh position={[0, 3, 0]} castShadow>
      <cylinderGeometry args={[0.6, 1.2, 6, 8]} />
      <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0, 8.5, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 5, 8]} />
      <meshStandardMaterial color="#94A3B8" metalness={0.9} />
    </mesh>
    <mesh position={[0.7, 4.5, 0]} rotation={[0, 0, Math.PI / 3]}>
      <sphereGeometry args={[0.8, 16, 16, 0, Math.PI]} />
      <meshStandardMaterial color="#F8FAFC" roughness={0.1} />
    </mesh>
    <mesh position={[0, 11, 0]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={3} />
    </mesh>
  </group>
);

const HeadOffice3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const BUILDING_HEIGHT = 16; // 4 floors

  const { shape, wallSegments, cx, cz } = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];

    HEAD_OFFICE_POLYGON.forEach((coord, i) => {
      const [lat, lng] = coord;
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const y = (lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      points2D.push({ wx: x, wz: -y });
    });

    let centerX = 0, centerZ = 0;
    points2D.forEach(p => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;

    const segments = [];
    for (let i = 0; i < points2D.length - 1; i++) {
      const p1 = points2D[i];
      const p2 = points2D[i + 1];
      const dx = p2.wx - p1.wx;
      const dz = p2.wz - p1.wz;
      const len = Math.sqrt(dx * dx + dz * dz);
      const midX = (p1.wx + p2.wx) / 2;
      const midZ = (p1.wz + p2.wz) / 2;

      let nx = dz / len; let nz = -dx / len;
      if (nx * (midX - centerX) + nz * (midZ - centerZ) < 0) { nx = -nx; nz = -nz; }
      segments.push({ midX, midZ, nx, nz, len });
    }
    return { shape: s, wallSegments: segments, cx: centerX, cz: centerZ };
  }, [center]);

  const buildingBaseColor = isDark ? "#334155" : "#E2E8F0";
  const hoverColor = isDark ? "#475569" : "#F8FAFC";

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} castShadow receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <extrudeGeometry args={[shape, { depth: BUILDING_HEIGHT, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" color={hovered ? hoverColor : buildingBaseColor} roughness={0.4} metalness={0.2} />
        <meshStandardMaterial attach="material-1" color={hovered ? hoverColor : buildingBaseColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {wallSegments.map((segment, idx) => <OfficeWallDecorations key={`ho-wall-${idx}`} segment={segment} isDark={isDark} />)}

      <NetworkTower cx={cx} cz={cz} />

      {hovered && <Html position={[cx, BUILDING_HEIGHT + 10, cz]} center style={{ pointerEvents: "none" }}><div className={`tooltip-3d ${isDark ? 'dark' : 'light'}`} style={{ fontWeight: 'bold', fontSize: '14px', background: '#38BDF8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px' }}>Main Head Office</div></Html>}
    </group>
  );
};

// --- Component: Flat Ground Slot ---
const Slot3D = ({ slot, center, isDark, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    slot.polygon.forEach((coord, i) => {
      const [lat, lng] = coord;
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const z = (lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
    });
    return s;
  }, [slot, center]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(slot); }}
    >
      <extrudeGeometry args={[shape, { depth: 1, bevelEnabled: false }]} />
      <meshStandardMaterial color={hovered ? (isDark ? "#4B5563" : "#F3F4F6") : (isDark ? "#374151" : "#E5E7EB")} roughness={0.9} />
    </mesh>
  );
};

// --- Main App ---
function App() {
  const [slots, setSlots] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [center, setCenter] = useState({ lat: 28.510, lng: 77.290 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoomAction, setZoomAction] = useState(null);
  const [isDark, setIsDark] = useState(false);

  // --- Live API Fetch Logic ---
  const fetchYardData = useCallback(() => {
    Promise.all([
      fetch("/slots.json").then((res) => res.ok ? res.json() : []),
      fetch("/container.json").then((res) => res.ok ? res.json() : { containers: [] })
    ])
      .then(([slotsData, containersData]) => {
        const validSlots = slotsData.filter(item => item.polygon && item.polygon.length >= 3);
        setSlots(validSlots);
        setContainers(containersData.containers || []);
        setLastUpdated(new Date());

        if (loading && validSlots.length > 0) {
          setCenter(calculateCenter(validSlots, WAREHOUSE_DATA));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("API Error / Files not found.", err);
        if (loading) {
          setCenter(calculateCenter([], WAREHOUSE_DATA));
          setLoading(false);
        }
      });
  }, [loading]);

  useEffect(() => {
    fetchYardData();
    const intervalId = setInterval(fetchYardData, API_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchYardData]);

  // --- Container Placement Engine ---
  const placedContainers = useMemo(() => {
    const slotGroups = {};
    const lngScale = Math.cos((center.lat * Math.PI) / 180);

    slots.forEach(slot => {
      if (!slotGroups[slot.id]) {
        slotGroups[slot.id] = { polygons: [] };
      }
      const points = slot.polygon.map(coord => ({
        x: (coord[1] - center.lng) * LAT_TO_METERS * lngScale,
        z: -(coord[0] - center.lat) * LAT_TO_METERS
      }));
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      points.forEach(p => {
        minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
      });
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      let maxDist = 0, angle = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dz = points[i + 1].z - points[i].z;
        const dist = Math.hypot(dx, dz);
        if (dist > maxDist) { maxDist = dist; angle = Math.atan2(dz, dx); }
      }
      slotGroups[slot.id].polygons.push({ cx, cz, angle });
    });

    const result = [];
    containers.forEach(container => {
      const stackLvl = parseInt(container.stack || "1", 10);
      if (stackLvl < 1 || stackLvl > 5) return;

      const group = slotGroups[container.loc];
      if (!group) return;

      const is40 = container.size === "40";
      const height = 2.6;
      const y = (stackLvl - 1) * height + (height / 2) + 0.1;

      let x = 0, z = 0, angle = 0;
      if (is40) {
        let sumX = 0, sumZ = 0;
        group.polygons.forEach(p => { sumX += p.cx; sumZ += p.cz; });
        x = sumX / group.polygons.length;
        z = sumZ / group.polygons.length;
        angle = group.polygons[0].angle;
      } else {
        const stackKey = `stack_${stackLvl}`;
        if (group[stackKey] === undefined) group[stackKey] = 0;
        const polyIndex = group[stackKey] % group.polygons.length;
        const targetPoly = group.polygons[polyIndex];
        x = targetPoly.cx;
        z = targetPoly.cz;
        angle = targetPoly.angle;
        group[stackKey]++;
      }
      result.push({ ...container, x, y, z, angle, is40 });
    });
    return result;
  }, [slots, containers, center]);

  if (loading) return <div className={`screen-message ${isDark ? 'dark' : 'light'}`}>Loading Live 3D Engine...</div>;

  return (
    <div className={`app-container ${isDark ? 'theme-dark' : 'theme-light'}`}>

      {/* UI Overlay */}
      <div className="ui-overlay">
        <div className="ui-header">
          <h1>Logistics 3D Yard</h1>
          <p className="subtitle">
            {slots.length} Yard Slots | {containers.length} Containers | {WAREHOUSE_DATA.length} Warehouses
          </p>
          <div style={{ fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10B981', borderRadius: '50%', boxShadow: '0 0 5px #10B981' }}></span>
            API Live • Last Sync: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="ui-controls-group">
          <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <div className="ui-zoom-controls">
            <button onClick={() => setZoomAction('in')} title="Zoom In">+</button>
            <button onClick={() => setZoomAction('out')} title="Zoom Out">−</button>
          </div>
        </div>

        {selectedItem && (
          <div className="ui-info-card fade-in" style={{ background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
            <div className="card-header" style={{ fontSize: '12px', opacity: 0.7 }}>
              {selectedItem.size ? "Container Details" : "Selected Yard Slot"}
            </div>
            <h3 style={{ margin: '5px 0' }}>{selectedItem.id}</h3>
            <div className="card-detail" style={{ fontSize: '14px' }}>
              {selectedItem.size ? (
                <>
                  <div style={{ marginBottom: '4px' }}>Size: <strong>{selectedItem.size} FT</strong></div>
                  <div style={{ marginBottom: '4px' }}>Location Path ID: <strong>{selectedItem.loc}</strong></div>
                  <div style={{ marginBottom: '4px' }}>Stack Level: <strong>{selectedItem.stack}</strong></div>
                </>
              ) : (
                <div>Path Vertices: <strong>{selectedItem.polygon.length}</strong></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3D Scene */}
      <Canvas camera={{ position: [0, 400, 400], fov: 45 }} shadows>
        <color attach="background" args={[isDark ? "#0f172a" : "#e2e8f0"]} />
        <CameraZoomHandler zoomAction={zoomAction} setZoomAction={setZoomAction} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[100, 300, 100]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-100, 100, -100]} intensity={0.3} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial color={isDark ? "#1e293b" : "#ffffff"} roughness={1} />
        </mesh>

        <MapControls enableDamping={true} dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={20} maxDistance={1500} />

        {/* 0. Head Office Building (new) */}
        <HeadOffice3D center={center} isDark={isDark} />

        {/* 1. Flat Paths (Slots exactly plotted) */}
        {slots.map((slot, idx) => (
          <Slot3D key={`slot-${idx}`} slot={slot} center={center} isDark={isDark} onClick={setSelectedItem} />
        ))}

        {/* 2. Containers (Pre-calculated strictly to slot paths) */}
        {placedContainers.map((container, idx) => (
          <Container3D key={`container-${container.id}-${idx}`} data={container} isDark={isDark} onClick={setSelectedItem} />
        ))}

        {/* 3. Warehouses (unchanged) */}
        {WAREHOUSE_DATA.map((wh, idx) => (
          <Warehouse3D key={`wh-${idx}`} data={wh} center={center} isDark={isDark} />
        ))}

        {/* 4. Segment-Based Flat Railway Track */}
        {useMemo(() => {
          const lngScale = Math.cos((center.lat * Math.PI) / 180);
          const pts = TRACK_COORDS.map(c => ({
            x: (c[1] - center.lng) * LAT_TO_METERS * lngScale,
            z: -(c[0] - center.lat) * LAT_TO_METERS
          }));
          return pts.slice(0, -1).map((p1, i) => {
            const p2 = pts[i + 1];
            const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
            return <TrackSegment key={i} cx={(p1.x + p2.x) / 2} cz={(p1.z + p2.z) / 2} len={len} angle={Math.atan2(p2.x - p1.x, p2.z - p1.z)} isDark={isDark} />;
          });
        }, [center, isDark])}

        {/* 5. Gantry Cranes */}
        {CRANE_COORDS.map((crane, idx) => (
          <Crane3D key={`crane-${idx}`} lat={crane.lat} lng={crane.lng} type={crane.type} center={center} isDark={isDark} />
        ))}

      </Canvas>
    </div>
  );
}

export default App;