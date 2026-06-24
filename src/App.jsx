// App.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { MapControls, Html } from "@react-three/drei";
import * as THREE from "three";
import "./App.css";




const LAT_TO_METERS = 111320;
const API_POLL_INTERVAL = 5000;

// --- Boundary Wall Coordinates ---
const BOUNDARY_WALL_COORDS = [
  [28.509232156091905, 77.28673914153669], [28.507338363972515, 77.28681925162508], [28.507388828969987, 77.28606886193224], [28.50887879022288, 77.2859366508579], [28.51513425216102, 77.28564939396986], [28.516105514074273, 77.28547565477994], [28.516569229877188, 77.28572424373732], [28.519108244303233, 77.28737110435144], [28.518904866086185, 77.28783919110512], [28.51575709433006, 77.2879127514761], [28.513909516566425, 77.28816611690752], [28.512519973456563, 77.28917375412553], [28.511527065899788, 77.2916025673494], [28.511463318732737, 77.29165396139055], [28.50789733914065, 77.29234998557078], [28.507746261322207, 77.29159098816812], [28.508096634293402, 77.29150477910063], [28.507860108269256, 77.2895383393366], [28.50753021124347, 77.28907320258013], [28.507735618945745, 77.2888276481522], [28.507837285240317, 77.28887014795086], [28.508468029022872, 77.28865764891665], [28.50848670230088, 77.28872612082445], [28.508866391577477, 77.28877806502395], [28.5093041736862, 77.28877806502247], [28.509233630723408, 77.28674043541311],
];

// --- Sub-Areas ---
const INGATE_POLYGON = [[28.508862180540508, 77.2887146535867], [28.508862180540508, 77.28884621675807], [28.508489551776456, 77.28886578813892], [28.508504839136275, 77.28873313766863]];
const OUTGATE_POLYGON = [[28.507732029353566, 77.2888193076692], [28.507533460460987, 77.28906833200674], [28.507458085232486, 77.28903697338644], [28.50768988415047, 77.28876396892754]];
const PARKING_COORDS = [[28.50889491841472, 77.28870920718118], [28.508913326434662, 77.28874674032724], [28.509292656765698, 77.28875681637923], [28.509269676368607, 77.28798769296093], [28.508928505264922, 77.28800848008274], [28.508698700275726, 77.28802926720272], [28.50872698399292, 77.28818751752696], [28.50880240720342, 77.28841215252098], [28.50884247576206, 77.28858984885952]];
const PATH_COORDS = [[28.508613232602404, 77.28774371246273], [28.5086270610609, 77.28778435853398], [28.509216304021855, 77.28774278429589], [28.509213947056594, 77.28769919840154]];
const CANTEEN_COORDS = [[28.508915790523016, 77.28776625363527], [28.5090006414807, 77.28775016038163], [28.509051905566967, 77.28773943154609], [28.50908843857876, 77.28774010209831]];

const HEAD_OFFICE_POLYGON = [
  [28.50921721347462, 77.2876475691699], [28.509125822340106, 77.28766336700072], [28.509129292890968, 77.28761334053647], [28.509039058531517, 77.28761860648007], [28.509036744828975, 77.28754751624142], [28.508996255026346, 77.2875448832696], [28.508995098174594, 77.28756989650174], [28.508910647963845, 77.28757252947354], [28.508902549994893, 77.28748432491817], [28.50884470734014, 77.28748300843061], [28.508676963465497, 77.28731844769297], [28.508670022332243, 77.28724209150724], [28.50859714042292, 77.28723945853544], [28.508587885573693, 77.28714467155055], [28.508600610991166, 77.28709727805813], [28.508543925028732, 77.28709332860042], [28.508541611315344, 77.28699854161553], [28.50849070960772, 77.28699590864375], [28.508488395893163, 77.28689453922934], [28.50902401946127, 77.28687215896902], [28.509030960569564, 77.28697616135523], [28.508850491605273, 77.28698406027061], [28.50885743272499, 77.28722497719053], [28.508907177402953, 77.28726973771117], [28.509207958676942, 77.28725788933805],
];

const WAREHOUSE_DATA = [
  { id: "Warehouse 1", polygon: [[28.51143341203824, 77.29014792543707], [28.511447553531475, 77.29061060646951], [28.50887469321554, 77.29073212892841], [28.50886142486985, 77.29025147014725], [28.51143341203824, 77.29014792543707]] },
  { id: "Warehouse 2", polygon: [[28.51112807640633, 77.28930776832516], [28.51114576715341, 77.2897859105682], [28.50960493713407, 77.28986465016293], [28.509580039693272, 77.28937354130709], [28.51112807640633, 77.28930776832516]] },
  { id: "Warehouse 3", polygon: [[28.50948198269312, 77.29158820098095], [28.509540076766502, 77.2919518104223], [28.508237102003246, 77.29219264264968], [28.508187306470095, 77.29182903320833], [28.50948198269312, 77.29158820098095]] },
  { id: "Warehouse 4", polygon: [[28.516129077394567, 77.28667217921567], [28.51617385678954, 77.28779736584238], [28.51584625972401, 77.28780541246903], [28.515805015417023, 77.28667754363342], [28.516129077394567, 77.28667217921567]] },
];

const TRACK_COORDS = [
  [28.50798029741757, 77.2861993278382], [28.511441251081667, 77.28608144845934], [28.513226522607233, 77.28598437130985], [28.514676652635337, 77.28588036009819], [28.516528890591463, 77.28581795337986],
  [28.517899769428844, 77.28680259289459], [28.519014737755104, 77.28747519872812], [28.52097656595973, 77.28848757455816], [28.5227129362258, 77.28815473873708], [28.520793788465724, 77.28893135584076], [28.51889897656675, 77.28863319036364], [28.516778696540648, 77.28838356336682],
];

const CRANE_COORDS = [
  { lat: 28.508020512511646, lng: 77.28626664099272, type: "yellow" }, { lat: 28.51023423558485, lng: 77.2861962934262, type: "orange" }, { lat: 28.510471828319627, lng: 77.28618627929005, type: "orange" }, { lat: 28.513893598879548, lng: 77.2870393486428, type: "yellow" }, { lat: 28.513437787133046, lng: 77.28773232686511, type: "orange" }, { lat: 28.510418860042552, lng: 77.28848155898685, type: "yellow" },
];

// --- NEW: Reach Stacker (RST) Coordinates ---
const RST_MACHINES = [
  { lat: 28.513710971678258, lng: 77.2871341926275, angle: Math.PI / 1 },
  { lat: 28.50950981669418, lng: 77.28775043401356, angle: -Math.PI / 9 },
  { lat: 28.509407382748716, lng: 77.28917767667743, angle: -Math.PI / 1 },
  { lat: 28.51173323962677, lng: 77.29054777363444, angle: -Math.PI / 5 },
  { lat: 28.51309880145435, lng: 77.28823378159592, angle: -Math.PI / 9 },
  { lat: 28.508881162704135, lng: 77.28649336396111, angle: -Math.PI / 30 },
  { lat: 28.50865788975487, lng: 77.28905220546747, angle: -Math.PI / 17 },
  { lat: 28.509442272100923, lng: 77.28984252037615, angle: -Math.PI / 17 },
  { lat: 28.508694913735585, lng: 77.29079854236463, angle: -Math.PI / 17 },
  { lat: 28.512022043629514, lng: 77.28973821348758, angle: -Math.PI / 5 }
];


const ROAD_SEGMENTS = [
  [
    [28.508774017771152, 77.2886683489405],
    [28.508657821342336, 77.28867316982749]
  ],
  [
    [28.5086390604457, 77.28833364164127],
    [28.508548887071168, 77.28839080358703]
  ],
  [
    [28.508434505966758, 77.28798929256652],
    [28.508327387043792, 77.28802992575689]
  ],
  [
    [28.508327992233706, 77.28772414377447],
    [28.508226925128213, 77.28773171945396]
  ],
  [
    [28.508303784550492, 77.28704784216228],
    [28.508193034338454, 77.28709811712663]
  ],
  [
    [28.508160353925316, 77.28690183815456],
    [28.508156722767712, 77.28704508736807]
  ],
  [
    [28.507407757004515, 77.28695005103073],
    [28.507405941412763, 77.28705404445014]
  ]
];





// ─────────────────────────────────────────────────────────────
//  🎨 Utility & Texture Helpers
// ─────────────────────────────────────────────────────────────
const SHIPPING_LINE_COLORS = {
  GSA: "#EF4444", ACC: "#3B82F6", ESS: "#22C55E", MAI: "#F97316",
  HLC: "#8B5CF6", OOCL: "#F59E0B", MSC: "#10B981", CMA: "#EC4899",
  COSCO: "#6366F1", EVER: "#14B8A6", HMM: "#F43F5E", ONE: "#8B5CF6",
  YML: "#F97316", ZIM: "#3B82F6", PIL: "#22C55E", SITC: "#EF4444",
  default: "#EF4444",
};

function getContainerColor(container) {
  const line = container.originalData?.SLINE_CD?.trim() || "";
  return SHIPPING_LINE_COLORS[line] || SHIPPING_LINE_COLORS.default;
}

function createContainerTexture(baseColor, isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const color = new THREE.Color(baseColor);
  ctx.fillStyle = color.getStyle(); ctx.fillRect(0, 0, 512, 512);

  const darkColor = color.clone().multiplyScalar(0.7);
  ctx.fillStyle = darkColor.getStyle();
  for (let x = 0; x < 512; x += 12) ctx.fillRect(x, 0, 2, 512);

  ctx.fillStyle = darkColor.getStyle();
  ctx.fillRect(0, 0, 512, 30); ctx.fillRect(0, 482, 512, 30);
  ctx.strokeStyle = darkColor.getStyle(); ctx.lineWidth = 4; ctx.strokeRect(380, 50, 120, 412);

  ctx.fillStyle = darkColor.getStyle();
  for (let y = 60; y < 450; y += 40) {
    ctx.beginPath(); ctx.arc(390, y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(490, y, 4, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = "#FFFFFF"; ctx.globalAlpha = 0.3;
  ctx.fillRect(50, 460, 200, 20); ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(1, 1);
  return texture;
}

function createWarningStripeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FACC15";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  for (let i = -512; i < 1024; i += 128) {
    ctx.moveTo(i, 0); ctx.lineTo(i + 64, 0); ctx.lineTo(i + 64 - 512, 512); ctx.lineTo(i - 512, 512);
  }
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 1);
  return texture;
}

function isPointInPolygon(point, vs) {
  let x = point[0], z = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], zi = vs[i][1]; let xj = vs[j][0], zj = vs[j][1];
    let intersect = ((zi > z) != (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function formatSlotId(rawId) {
  if (!rawId) return rawId;
  const parts = rawId.split(":");
  if (parts.length >= 3) { parts[1] = parts[1].padStart(3, "0"); parts[2] = parts[2].padStart(3, "0"); }
  return parts.join(":");
}

function calculateCenter(slots, warehouses) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  slots.forEach((slot) => { slot.polygon.forEach(([lat, lng]) => { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }); });
  warehouses.forEach((wh) => { wh.polygon.forEach(([lat, lng]) => { minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat); minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng); }); });
  if (minLat === Infinity) return { lat: 28.510, lng: 77.290 };
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

const CameraZoomHandler = ({ zoomAction, setZoomAction }) => {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (zoomAction && controls) {
      const direction = new THREE.Vector3().subVectors(camera.position, controls.target);
      const zoomFactor = zoomAction === "in" ? 0.7 : 1.4;
      camera.position.copy(controls.target).add(direction.multiplyScalar(zoomFactor));
      controls.update();
      setZoomAction(null);
    }
  }, [zoomAction, camera, controls, setZoomAction]);
  return null;
};

// ─────────────────────────────────────────────────────────────
//  🏗️ Reach Stacker (RST Machine) Component
// ─────────────────────────────────────────────────────────────
const ReachStacker3D = ({ lat, lng, angle, center, isDark }) => {
  const [hovered, setHovered] = useState(false);

  // Math translation for coordinates
  const lngScale = Math.cos((center.lat * Math.PI) / 180);
  const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
  const z = -(lat - center.lat) * LAT_TO_METERS;

  // Custom RST Colors
  const bodyColor = "#FACC15"; // Industrial Yellow
  const armColor = "#EA580C"; // Heavy Orange
  const wheelColor = "#111827"; // Rubber Black
  const glassColor = "#38BDF8"; // Cabin Glass
  const metalColor = isDark ? "#374151" : "#4B5563";

  return (
    <group
      position={[x, 0, z]}
      rotation={[0, angle, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      {/* 1. Main Heavy Chassis */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 1.5, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} />
      </mesh>

      {/* 2. Front & Rear Wheels (Heavy Duty) */}
      <mesh position={[-2, 1, 3]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1, 1, 0.8, 16]} /><meshStandardMaterial color={wheelColor} roughness={0.9} /></mesh>
      <mesh position={[2, 1, 3]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1, 1, 0.8, 16]} /><meshStandardMaterial color={wheelColor} roughness={0.9} /></mesh>
      <mesh position={[-2, 1, -3]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1, 1, 0.8, 16]} /><meshStandardMaterial color={wheelColor} roughness={0.9} /></mesh>
      <mesh position={[2, 1, -3]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1, 1, 0.8, 16]} /><meshStandardMaterial color={wheelColor} roughness={0.9} /></mesh>

      {/* 3. Driver Cabin */}
      <mesh position={[0, 3.1, -1.5]} castShadow>
        <boxGeometry args={[2.5, 1.8, 2]} />
        <meshStandardMaterial color={glassColor} transparent opacity={0.7} metalness={0.8} />
      </mesh>

      {/* 4. Hydraulic Arm Base */}
      <mesh position={[0, 2.5, -3.5]} castShadow>
        <boxGeometry args={[1.5, 1.5, 2]} />
        <meshStandardMaterial color={metalColor} />
      </mesh>

      {/* 5. Telescopic Orange Boom Arm */}
      <mesh position={[0, 4.8, 1.5]} rotation={[-Math.PI / 6.5, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 10]} />
        <meshStandardMaterial color={armColor} roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 7, 5.5]} rotation={[-Math.PI / 6.5, 0, 0]} castShadow>
        <boxGeometry args={[0.8, 0.8, 4]} />
        <meshStandardMaterial color={metalColor} />
      </mesh>

      {/* 6. Top Spreader (Container Grabber) */}
      <mesh position={[0, 7.3, 7.5]} castShadow>
        <boxGeometry args={[6.1, 0.4, 1.5]} />
        <meshStandardMaterial color={wheelColor} />
      </mesh>
      {/* Spreader Latches */}
      <mesh position={[-2.9, 6.8, 7.5]} castShadow><boxGeometry args={[0.2, 1, 0.4]} /><meshStandardMaterial color={wheelColor} /></mesh>
      <mesh position={[2.9, 6.8, 7.5]} castShadow><boxGeometry args={[0.2, 1, 0.4]} /><meshStandardMaterial color={wheelColor} /></mesh>

      {/* Hover Tooltip */}
      {hovered && (
        <Html position={[0, 10, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#EA580C", color: "#fff", border: "2px solid #fff", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
            RST Machine (Reach Stacker)
          </div>
        </Html>
      )}
    </group>
  );
};

// ─────────────────────────────────────────────────────────────
//  🏗️ Path & Canteen Components (Restored)
// ─────────────────────────────────────────────────────────────
const PathArea3D = ({ center }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    PATH_COORDS.forEach(([lat, lng], i) => {
      const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
      const z = -(lat - center.lat) * LAT_TO_METERS;
      if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
    });
    return s;
  }, [center]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#3F3F46" roughness={0.8} />
    </mesh>
  );
};

const Canteen3D = ({ center }) => {
  const pillarColor = "#334155";
  const roofColor = "#1E293B";

  const { shape, points } = useMemo(() => {
    const s = new THREE.Shape();
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = CANTEEN_COORDS.map(([lat, lng]) => [
      (lng - center.lng) * LAT_TO_METERS * lngScale,
      -(lat - center.lat) * LAT_TO_METERS
    ]);
    pts.forEach(([x, z], i) => {
      if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
    });
    return { shape: s, points: pts };
  }, [center]);

  return (
    <group>
      {/* Iron Pillars */}
      {points.map((p, i) => (
        <mesh key={i} position={[p[0], 2.25, p[1]]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 4.5, 12]} />
          <meshStandardMaterial color={pillarColor} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Roof */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4.5, 0]} castShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={roofColor} roughness={0.4} />
      </mesh>
      {/* Label */}
      <Html position={[points[0][0], 6, points[0][1]]} center>
        <div style={{ background: "#FACC15", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap" }}>Canteen Area</div>
      </Html>
    </group>
  );
};


// ─────────────────────────────────────────────────────────────
//  Parking Area 3D
// ─────────────────────────────────────────────────────────────
const ParkingArea3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const stripeTexture = useMemo(() => createWarningStripeTexture(), []);

  const { points2D, shape, bounds, parkingLines, barriers } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = PARKING_COORDS.map(c => [
      (c[1] - center.lng) * LAT_TO_METERS * lngScale,
      -(c[0] - center.lat) * LAT_TO_METERS
    ]);

    const s = new THREE.Shape();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let cx = 0, cz = 0;

    pts.forEach(([x, z], i) => {
      if (i === 0) s.moveTo(x, z); else s.lineTo(x, z);
      cx += x; cz += z;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    });

    cx /= pts.length; cz /= pts.length;

    const bItems = [];
    const barrierLength = 1.8;
    for (let i = 0; i < pts.length; i++) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const dx = p2[0] - p1[0]; const dz = p2[1] - p1[1];
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const numBarriers = Math.floor(dist / barrierLength);

      for (let b = 0; b < numBarriers; b++) {
        const bx = p1[0] + (dx / dist) * (b * barrierLength + barrierLength / 2);
        const bz = p1[1] + (dz / dist) * (b * barrierLength + barrierLength / 2);
        bItems.push({ x: bx, z: bz, angle });
      }
    }

    const pLines = [];
    const spotWidth = 2.6;
    const spotLength = 5.0;

    for (let x = minX; x < maxX; x += spotWidth) {
      for (let z = minZ; z < maxZ; z += spotLength * 1.5) {
        const spotCx = x + spotWidth / 2;
        const spotCz = z + spotLength / 2;
        if (isPointInPolygon([spotCx, spotCz], pts)) {
          pLines.push({ x: spotCx, z: spotCz });
        }
      }
    }

    return { points2D: pts, shape: s, bounds: { minX, maxX, minZ, maxZ }, parkingLines: pLines, barriers: bItems, centerCoords: { cx, cz } };
  }, [center]);

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={isDark ? "#3F3F46" : "#71717A"} roughness={0.9} />
      </mesh>
      {parkingLines.map((spot, i) => (
        <group key={`parking-spot-${i}`} position={[spot.x, 0.06, spot.z]}>
          <mesh position={[-1.25, 0, 0]}><boxGeometry args={[0.1, 0.02, 5]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
          <mesh position={[0, 0, -2.5]}><boxGeometry args={[2.6, 0.02, 0.1]} /><meshBasicMaterial color="#FFFFFF" /></mesh>
        </group>
      ))}
      {barriers.map((b, i) => (
        <mesh key={`barrier-${i}`} position={[b.x, 0.5, b.z]} rotation={[0, -b.angle, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 1, 0.6]} />
          <meshStandardMaterial map={stripeTexture} roughness={0.8} />
        </mesh>
      ))}
      {hovered && (
        <Html position={[bounds.minX + (bounds.maxX - bounds.minX) / 2, 5, bounds.minZ + (bounds.maxZ - bounds.minZ) / 2]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#FACC15", color: "#111827", border: "2px solid #111827", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
            Vehicle Parking Area
          </div>
        </Html>
      )}
    </group>
  );
};


// ─────────────────────────────────────────────────────────────
//  Boundary Wall (With Gaps for BOTH Gates)
// ─────────────────────────────────────────────────────────────
const BoundaryWall3D = ({ center, isDark }) => {
  const wallHeight = 5.2;
  const wallThickness = 0.6;
  const skinColor = "#E6C280";
  const foundationColor = isDark ? "#374151" : "#9CA3AF";
  const trimColor = isDark ? "#1F2937" : "#4B5563";
  const pillarColor = isDark ? "#4B5563" : "#6B7280";

  const segments = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const pts = BOUNDARY_WALL_COORDS.map((coord) => ({
      x: (coord[1] - center.lng) * LAT_TO_METERS * lngScale,
      z: -(coord[0] - center.lat) * LAT_TO_METERS,
    }));

    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i]; const p2 = pts[i + 1];
      const dx = p2.x - p1.x; const dz = p2.z - p1.z;
      const len = Math.hypot(dx, dz);
      const cx = (p1.x + p2.x) / 2; const cz = (p1.z + p2.z) / 2;
      const angle = Math.atan2(dz, dx);
      const isOutGateGap = i === 18;
      const isInGateGap = i === 22;
      segs.push({ cx, cz, len, angle, p1, p2, isInGateGap, isOutGateGap, index: i });
    }
    return segs;
  }, [center]);

  return (
    <group>
      {segments.map((seg, i) => {
        if (seg.isInGateGap || seg.isOutGateGap) return null;
        return (
          <group key={`wall-seg-${i}`} position={[seg.cx, 0, seg.cz]} rotation={[0, -seg.angle, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[seg.len, 0.8, wallThickness + 0.2]} /><meshStandardMaterial color={foundationColor} roughness={0.9} /></mesh>
            <mesh position={[0, 0.8 + (wallHeight - 0.8) / 2, 0]} castShadow receiveShadow><boxGeometry args={[seg.len, wallHeight - 0.8, wallThickness]} /><meshStandardMaterial color={skinColor} roughness={0.8} /></mesh>
            <mesh position={[0, wallHeight + 0.1, 0]} castShadow receiveShadow><boxGeometry args={[seg.len + 0.1, 0.2, wallThickness + 0.3]} /><meshStandardMaterial color={trimColor} roughness={0.7} /></mesh>
          </group>
        );
      })}
      {segments.map((seg, i) => (
        <group key={`wall-pillar-${i}`} position={[seg.p1.x, 0, seg.p1.z]}>
          <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow><boxGeometry args={[wallThickness + 0.6, wallHeight + 0.4, wallThickness + 0.6]} /><meshStandardMaterial color={pillarColor} roughness={0.8} /></mesh>
          <mesh position={[0, wallHeight + 0.4 + 0.15, 0]} castShadow><cylinderGeometry args={[0, wallThickness + 0.5, 0.3, 4]} rotation={[0, Math.PI / 4, 0]} /><meshStandardMaterial color={trimColor} /></mesh>
        </group>
      ))}
    </group>
  );
};


// ─────────────────────────────────────────────────────────────
//  In-Gate Plaza Component
// ─────────────────────────────────────────────────────────────
const InGate3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);

  const { cx, cz, angle, width, depth } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];
    INGATE_POLYGON.forEach((coord) => {
      const x = (coord[1] - center.lng) * LAT_TO_METERS * lngScale;
      const y = (coord[0] - center.lat) * LAT_TO_METERS;
      points2D.push({ wx: x, wz: -y });
    });

    let centerX = 0, centerZ = 0;
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;

    let maxDist = 0; let localAngle = 0;
    for (let i = 0; i < points2D.length; i++) {
      const p1 = points2D[i]; const p2 = points2D[(i + 1) % points2D.length];
      const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
      const dist = Math.hypot(dx, dz);
      if (dist > maxDist) { maxDist = dist; localAngle = Math.atan2(dz, dx); }
    }
    return { cx: centerX, cz: centerZ, angle: localAngle, width: maxDist, depth: 8 };
  }, [center]);

  const roofColor = "#065F46"; const roofAccent = "#047857"; const skinColor = "#F5D0A9";
  const islandColor = isDark ? "#4B5563" : "#D1D5DB"; const glassColor = "#38BDF8";
  const metalColor = isDark ? "#374151" : "#64748B"; const yellowWarning = "#FACC15";

  const roofHeight = 6.5; const numLanes = 4; const numBooths = numLanes + 1;
  const laneSpacing = width / numLanes;

  const BarrierArm = () => {
    const armLength = laneSpacing - 1.2; const segments = 8; const segLength = armLength / segments;
    return (
      <group rotation={[0, 0, 0]}>
        {[...Array(segments)].map((_, i) => (
          <mesh key={i} position={[(i * segLength) + (segLength / 2), 0, 0]} castShadow>
            <boxGeometry args={[segLength, 0.15, 0.05]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#EF4444" : "#FFFFFF"} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[armLength, 0.1, 0]}><boxGeometry args={[0.1, 0.05, 0.06]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} /></mesh>
      </group>
    );
  };

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <group position={[cx, roofHeight, cz]} rotation={[0, -angle, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}><boxGeometry args={[width + 4, 0.8, depth]} /><meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.1} /></mesh>
        <mesh position={[0, 0.2, 0]}><boxGeometry args={[width + 4.2, 1, depth + 0.2]} /><meshStandardMaterial color={roofAccent} roughness={0.6} /></mesh>
      </group>

      <group position={[cx, 0, cz]} rotation={[0, -angle, 0]}>
        {[...Array(numBooths)].map((_, i) => {
          const offsetX = -width / 2 + (i * laneSpacing);
          return (
            <group key={`booth-set-${i}`} position={[offsetX, 0, 0]}>
              <mesh position={[0, 0.2, 0]} receiveShadow castShadow><boxGeometry args={[2.2, 0.4, 6]} /><meshStandardMaterial color={islandColor} roughness={0.9} /></mesh>
              <mesh position={[0, roofHeight / 2, -1.5]} castShadow><cylinderGeometry args={[0.2, 0.2, roofHeight, 8]} /><meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.3} /></mesh>
              <group position={[0, 2.2, 1]}>
                <mesh castShadow receiveShadow><boxGeometry args={[1.6, 3.6, 2.8]} /><meshStandardMaterial color={skinColor} roughness={0.9} /></mesh>
                <mesh position={[0, 1.85, 0]} castShadow><boxGeometry args={[1.8, 0.2, 3]} /><meshStandardMaterial color={metalColor} roughness={0.6} /></mesh>
                <mesh position={[0, 0.3, 1.41]} castShadow><boxGeometry args={[1.4, 1.5, 0.05]} /><meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.9} roughness={0.1} /></mesh>
                <mesh position={[-0.81, 0.3, 0]} castShadow><boxGeometry args={[0.05, 1.5, 2.6]} /><meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.9} roughness={0.1} /></mesh>
                <mesh position={[0.81, 0.3, 0]} castShadow><boxGeometry args={[0.05, 1.5, 2.6]} /><meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.9} roughness={0.1} /></mesh>
              </group>

              {i < numLanes && (
                <group position={[1.4, 0.9, 2]}>
                  <mesh castShadow><boxGeometry args={[0.5, 1.2, 0.6]} /><meshStandardMaterial color={yellowWarning} metalness={0.4} roughness={0.6} /></mesh>
                  <mesh position={[0, -0.5, 0]} castShadow><boxGeometry args={[0.7, 0.2, 0.8]} /><meshStandardMaterial color={metalColor} /></mesh>
                  <group position={[0.2, 0.4, 0]}><BarrierArm /></group>
                </group>
              )}
              {i > 0 && (
                <group position={[-1.4, 0.5, 2]}>
                  <mesh castShadow><cylinderGeometry args={[0.08, 0.08, 1, 8]} /><meshStandardMaterial color={yellowWarning} /></mesh>
                  <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color={metalColor} /></mesh>
                </group>
              )}
            </group>
          );
        })}
      </group>

      {hovered && (
        <Html position={[cx, roofHeight + 3, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#065F46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
            Main Terminal In-Gate
          </div>
        </Html>
      )}
    </group>
  );
};


// ─────────────────────────────────────────────────────────────
//  Out-Gate Plaza Component
// ─────────────────────────────────────────────────────────────
const OutGate3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);

  const { cx, cz, angle, width, depth } = useMemo(() => {
    const lngScale = Math.cos((center.lat * Math.PI) / 180);
    const points2D = [];
    OUTGATE_POLYGON.forEach((coord) => {
      const x = (coord[1] - center.lng) * LAT_TO_METERS * lngScale;
      const y = (coord[0] - center.lat) * LAT_TO_METERS;
      points2D.push({ wx: x, wz: -y });
    });

    let centerX = 0, centerZ = 0;
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
    centerX /= points2D.length; centerZ /= points2D.length;

    let maxDist = 0; let localAngle = 0;
    for (let i = 0; i < points2D.length; i++) {
      const p1 = points2D[i]; const p2 = points2D[(i + 1) % points2D.length];
      const dx = p2.wx - p1.wx; const dz = p2.wz - p1.wz;
      const dist = Math.hypot(dx, dz);
      if (dist > maxDist) { maxDist = dist; localAngle = Math.atan2(dz, dx); }
    }
    return { cx: centerX, cz: centerZ, angle: localAngle, width: maxDist, depth: 6 };
  }, [center]);

  const roofColor = "#065F46"; const roofAccent = "#047857"; const skinColor = "#F5D0A9";
  const islandColor = isDark ? "#4B5563" : "#D1D5DB"; const glassColor = "#38BDF8";
  const metalColor = isDark ? "#374151" : "#64748B"; const yellowWarning = "#FACC15";

  const roofHeight = 5.5;
  const numLanes = 1;
  const numBooths = 2;
  const laneSpacing = width / numLanes;

  const Railing = ({ length }) => (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.7, 0]} castShadow><boxGeometry args={[0.1, 0.05, length]} /><meshStandardMaterial color={metalColor} metalness={0.8} /></mesh>
      <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.1, 0.05, length]} /><meshStandardMaterial color={metalColor} metalness={0.8} /></mesh>
      {[-length / 2.5, 0, length / 2.5].map(z => (
        <mesh key={z} position={[0, 0.45, z]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.9, 6]} /><meshStandardMaterial color={metalColor} metalness={0.8} /></mesh>
      ))}
    </group>
  );

  const BarrierArm = () => {
    const armLength = laneSpacing - 2.8;
    const segments = 8; const segLength = armLength / segments;
    return (
      <group rotation={[0, 0, 0]}>
        {[...Array(segments)].map((_, i) => (
          <mesh key={i} position={[(i * segLength) + (segLength / 2), 0, 0]} castShadow>
            <boxGeometry args={[segLength, 0.15, 0.05]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#EF4444" : "#FFFFFF"} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[armLength, 0.1, 0]}><boxGeometry args={[0.1, 0.05, 0.06]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2} /></mesh>
      </group>
    );
  };

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
    >
      <group position={[cx, roofHeight, cz]} rotation={[0, -angle, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}><boxGeometry args={[width + 4, 0.6, depth]} /><meshStandardMaterial color={roofColor} roughness={0.7} metalness={0.1} /></mesh>
        <mesh position={[0, 0.15, 0]}><boxGeometry args={[width + 4.2, 0.8, depth + 0.2]} /><meshStandardMaterial color={roofAccent} roughness={0.6} /></mesh>
      </group>

      <group position={[cx, 0, cz]} rotation={[0, -angle, 0]}>
        {[...Array(numBooths)].map((_, i) => {
          const offsetX = -width / 2 + (i * laneSpacing);
          return (
            <group key={`out-booth-${i}`} position={[offsetX, 0, 0]}>
              <mesh position={[0, 0.2, 0]} receiveShadow castShadow><boxGeometry args={[2.2, 0.4, 6]} /><meshStandardMaterial color={islandColor} roughness={0.9} /></mesh>
              <mesh position={[0, roofHeight / 2, -1.5]} castShadow><cylinderGeometry args={[0.2, 0.2, roofHeight, 8]} /><meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.3} /></mesh>

              <group position={[i === 0 ? -0.9 : 0.9, 0.4, 0]}><Railing length={5.8} /></group>

              {i === 0 && (
                <group position={[0, 2.2, 1]}>
                  <mesh castShadow receiveShadow><boxGeometry args={[1.6, 3.6, 2.8]} /><meshStandardMaterial color={skinColor} roughness={0.9} /></mesh>
                  <mesh position={[0, 1.85, 0]} castShadow><boxGeometry args={[1.8, 0.2, 3]} /><meshStandardMaterial color={metalColor} roughness={0.6} /></mesh>
                  <mesh position={[0, 0.3, 1.41]} castShadow><boxGeometry args={[1.4, 1.5, 0.05]} /><meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.9} roughness={0.1} /></mesh>
                  <mesh position={[-0.81, 0.3, 0]} castShadow><boxGeometry args={[0.05, 1.5, 2.6]} /><meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.9} roughness={0.1} /></mesh>
                  <mesh position={[0.81, 0.3, 0]} castShadow><boxGeometry args={[0.05, 1.5, 2.6]} /><meshStandardMaterial color={glassColor} transparent opacity={0.6} metalness={0.9} roughness={0.1} /></mesh>
                </group>
              )}

              {i === 0 && (
                <group position={[1.4, 0.9, 2]}>
                  <mesh castShadow><boxGeometry args={[0.5, 1.2, 0.6]} /><meshStandardMaterial color={yellowWarning} metalness={0.4} roughness={0.6} /></mesh>
                  <mesh position={[0, -0.5, 0]} castShadow><boxGeometry args={[0.7, 0.2, 0.8]} /><meshStandardMaterial color={metalColor} /></mesh>
                  <group position={[0.2, 0.4, 0]}><BarrierArm /></group>
                </group>
              )}

              {i === 1 && (
                <group position={[-1.4, 0.5, 2]}>
                  <mesh castShadow><cylinderGeometry args={[0.08, 0.08, 1, 8]} /><meshStandardMaterial color={yellowWarning} /></mesh>
                  <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.15, 0.2, 0.15]} /><meshStandardMaterial color={metalColor} /></mesh>
                </group>
              )}
            </group>
          );
        })}
      </group>

      {hovered && (
        <Html position={[cx, roofHeight + 3, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#065F46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
            Terminal Out-Gate
          </div>
        </Html>
      )}
    </group>
  );
};


// ─────────────────────────────────────────────────────────────
//  📦 Container & Static Components
// ─────────────────────────────────────────────────────────────
const geo40ft = new THREE.BoxGeometry(12.2, 2.6, 2.4);
const geo20ft = new THREE.BoxGeometry(6.1, 2.6, 2.4);
const edges40ft = new THREE.EdgesGeometry(geo40ft);
const edges20ft = new THREE.EdgesGeometry(geo20ft);

const Container3D = React.memo(({ data, isDark, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const geometry = data.is40 ? geo40ft : geo20ft;
  const edgeGeo = data.is40 ? edges40ft : edges20ft;

  const color = getContainerColor(data);
  const texture = useMemo(() => createContainerTexture(color, isDark), [color, isDark]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture, roughness: 0.5, metalness: 0.3, color: new THREE.Color(color),
    });
  }, [texture, color]);

  const hoverMaterial = useMemo(() => {
    const c = new THREE.Color(color);
    c.lerp(new THREE.Color(0xffffff), 0.3);
    return new THREE.MeshStandardMaterial({
      map: texture, roughness: 0.3, metalness: 0.2, color: c,
    });
  }, [texture, color]);

  const currentMaterial = hovered ? hoverMaterial : material;
  const edgeMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({ color: isDark ? "#4B5563" : "#374151" });
  }, [isDark]);

  return (
    <mesh
      position={[data.x, data.y, data.z]} rotation={[0, -data.angle, 0]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      onClick={(e) => { e.stopPropagation(); onClick(data); }}
      geometry={geometry} material={currentMaterial}
    >
      <lineSegments geometry={edgeGeo} material={edgeMaterial} />
    </mesh>
  );
});

const Crane3D = ({ lat, lng, type, center, isDark }) => {
  const lngScale = Math.cos((center.lat * Math.PI) / 200);
  const x = (lng - center.lng) * LAT_TO_METERS * lngScale;
  const z = -(lat - center.lat) * LAT_TO_METERS;
  const isYellow = type === "yellow";
  const craneColor = isYellow ? "#FACC15" : "#EA580C";
  const darkMetal = isDark ? "#1F2937" : "#374151";

  return (
    <group position={[x, 0, z]}>
      <mesh position={[-12, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 3, 10]} /><meshStandardMaterial color={darkMetal} roughness={0.8} /></mesh>
      <mesh position={[12, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[4, 3, 10]} /><meshStandardMaterial color={darkMetal} roughness={0.8} /></mesh>
      <mesh position={[-12, 13, 0]} castShadow receiveShadow><boxGeometry args={[3, 20, 3]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[12, 13, 0]} castShadow receiveShadow><boxGeometry args={[3, 20, 3]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh>
      {isYellow ? (
        <><mesh position={[0, 24, -1.5]} castShadow receiveShadow><boxGeometry args={[34, 3, 1.5]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh><mesh position={[0, 24, 1.5]} castShadow receiveShadow><boxGeometry args={[34, 3, 1.5]} /><meshStandardMaterial color={craneColor} roughness={0.5} metalness={0.2} /></mesh></>
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

const TrackSegment = ({ cx, cz, len, angle, isDark }) => {
  const trackCenters = [-6, -2, 2, 6];
  const gaugeHalf = 1.676 / 2;
  const railW = 0.15;
  const poleSpacing = 40;
  const numPoles = Math.floor(len / poleSpacing);
  const poles = [];
  for (let k = 0; k <= numPoles; k++) { poles.push(-len / 2 + k * poleSpacing); }
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
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
      points2D.push({ wx: x, wz: -y });
    });
    let cx = 0, cz = 0;
    points2D.forEach((p) => { cx += p.wx; cz += p.wz; });
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
      let nx = dz / len, nz = -dx / len;
      if (nx * (midX - cx) + nz * (midZ - cz) < 0) { nx = -nx; nz = -nz; }
      segments.push({ midX, midZ, nx, nz, len });
    }
    return { shape: s, wallSegments: segments };
  }, [data, center]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} castShadow receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <extrudeGeometry args={[shape, { depth: 10, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" color={hovered ? (isDark ? "#94A3B8" : "#E2E8F0") : isDark ? "#475569" : "#94A3B8"} roughness={0.7} metalness={0.3} />
        <meshStandardMaterial attach="material-1" color={hovered ? (isDark ? "#94A3B8" : "#E2E8F0") : isDark ? "#64748B" : "#F1F5F9"} roughness={0.9} />
      </mesh>
      {wallSegments.map((segment, idx) => (
        <WallDecorations key={`wall-detail-${idx}`} segment={segment} />
      ))}
      {hovered && (
        <Html position={[0, 15, 0]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`}>{data.id}</div>
        </Html>
      )}
    </group>
  );
};

const OfficeWallDecorations = ({ segment, isDark }) => {
  const { midX, midZ, nx, nz, len } = segment;
  const rotationY = Math.atan2(nx, nz);
  const yRotation = [0, rotationY, 0];
  const depthOffset = 0.15;
  const pos = [midX + nx * depthOffset, 0, midZ + nz * depthOffset];
  const glassColor = "#FFFFFF";
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
      {[4, 8, 12].map((y) => (
        <mesh key={`band-${y}`} position={[0, y, 0]} castShadow><boxGeometry args={[len, 0.4, 0.2]} /><meshStandardMaterial color={frameColor} metalness={0.5} /></mesh>
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
    <mesh position={[0, 3, 0]} castShadow><cylinderGeometry args={[0.6, 1.2, 6, 8]} /><meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.3} /></mesh>
    <mesh position={[0, 8.5, 0]} castShadow><cylinderGeometry args={[0.1, 0.1, 5, 8]} /><meshStandardMaterial color="#94A3B8" metalness={0.9} /></mesh>
    <mesh position={[0.7, 4.5, 0]} rotation={[0, 0, Math.PI / 3]}><sphereGeometry args={[0.8, 16, 16, 0, Math.PI]} /><meshStandardMaterial color="#F8FAFC" roughness={0.1} /></mesh>
    <mesh position={[0, 11, 0]}><sphereGeometry args={[0.2, 16, 16]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={3} /></mesh>
  </group>
);

const HeadOffice3D = ({ center, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const BUILDING_HEIGHT = 16;
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
    points2D.forEach((p) => { centerX += p.wx; centerZ += p.wz; });
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
      let nx = dz / len, nz = -dx / len;
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
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <extrudeGeometry args={[shape, { depth: BUILDING_HEIGHT, bevelEnabled: false }]} />
        <meshStandardMaterial attach="material-0" color={hovered ? hoverColor : buildingBaseColor} roughness={0.4} metalness={0.2} />
        <meshStandardMaterial attach="material-1" color={hovered ? hoverColor : buildingBaseColor} roughness={0.4} metalness={0.2} />
      </mesh>
      {wallSegments.map((segment, idx) => (
        <OfficeWallDecorations key={`ho-wall-${idx}`} segment={segment} isDark={isDark} />
      ))}
      <NetworkTower cx={cx} cz={cz} />
      {hovered && (
        <Html position={[cx, BUILDING_HEIGHT + 10, cz]} center style={{ pointerEvents: "none" }}>
          <div className={`tooltip-3d ${isDark ? "dark" : "light"}`} style={{ fontWeight: "bold", fontSize: "14px", background: "#38BDF8", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px" }}>
            Main Head Office
          </div>
        </Html>
      )}
    </group>
  );
};

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
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}
      onClick={(e) => { e.stopPropagation(); onClick(slot); }}
    >
      <extrudeGeometry args={[shape, { depth: 1, bevelEnabled: false }]} />
      <meshStandardMaterial color={hovered ? (isDark ? "#4B5563" : "#F3F4F6") : isDark ? "#374151" : "#E5E7EB"} roughness={0.9} />
    </mesh>
  );
};


// ─────────────────────────────────────────────────────────────
//  MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────
function App() {
  const [slots, setSlots] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [center, setCenter] = useState({ lat: 28.510, lng: 77.290 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [zoomAction, setZoomAction] = useState(null);
  const [isDark, setIsDark] = useState(false);

  const fetchYardData = useCallback(() => {
    Promise.all([
      fetch("/slots.json").then((res) => (res.ok ? res.json() : [])),
      // fetch("/csvjson.json").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([slotsData, containersDataArray]) => {
        const validSlots = slotsData.filter((item) => item.polygon && item.polygon.length >= 3);
        setSlots(validSlots);

        const mappedContainers = Array.isArray(containersDataArray)
          ? containersDataArray
            .filter((item) => item.STK_ID && item.ROW_NO !== undefined && item.COLUMN_NO !== undefined)
            .map((item) => {
              const heightChar = item.HEIGHT ? item.HEIGHT.toUpperCase() : "A";
              const stackLvl = heightChar.charCodeAt(0) - 64;
              const rawSlotKey = `${String(item.STK_ID).trim()}:${String(item.ROW_NO).padStart(3, "0")}:${String(item.COLUMN_NO).padStart(3, "0")}`;

              return {
                id: item['20"CTR_NO'] || item.ID || "UNKNOWN",
                size: String(item.CTR_SIZE || "20"),
                loc: rawSlotKey,
                stack: stackLvl,
                originalData: item,
                _rawKey: rawSlotKey,
              };
            })
          : [];

        setContainers(mappedContainers);
        setLastUpdated(new Date());

        if (loading && validSlots.length > 0) {
          setCenter(calculateCenter(validSlots, WAREHOUSE_DATA));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("API Error / Files not found.", err);
        if (loading) { setCenter(calculateCenter([], WAREHOUSE_DATA)); setLoading(false); }
      });
  }, [loading]);

  useEffect(() => {
    fetchYardData();
    const intervalId = setInterval(fetchYardData, API_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchYardData]);

  const placedContainers = useMemo(() => {
    const slotGroups = {};
    const lngScale = Math.cos((center.lat * Math.PI) / 180);

    slots.forEach((slot) => {
      const formattedId = formatSlotId(slot.id);
      if (!slotGroups[formattedId]) slotGroups[formattedId] = { polygons: [] };
      const points = slot.polygon.map((coord) => ({
        x: (coord[1] - center.lng) * LAT_TO_METERS * lngScale,
        z: -(coord[0] - center.lat) * LAT_TO_METERS,
      }));
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      points.forEach((p) => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      let maxDist = 0, angle = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x; const dz = points[i + 1].z - points[i].z;
        const dist = Math.hypot(dx, dz);
        if (dist > maxDist) { maxDist = dist; angle = Math.atan2(dz, dx); }
      }
      slotGroups[formattedId].polygons.push({ cx, cz, angle });
    });

    const result = [];
    containers.forEach((container) => {
      const stackLvl = parseInt(container.stack || "1", 10);
      if (stackLvl < 1 || stackLvl > 6) return;
      const group = slotGroups[container.loc];
      if (!group) return;

      const is40 = container.size === "40";
      const height = 2.6;
      const y = (stackLvl - 1) * height + height / 2 + 0.1;

      let x = 0, z = 0, angle = 0;
      if (is40) {
        let sumX = 0, sumZ = 0;
        group.polygons.forEach((p) => { sumX += p.cx; sumZ += p.cz; });
        x = sumX / group.polygons.length; z = sumZ / group.polygons.length; angle = group.polygons[0].angle;
      } else {
        const stackKey = `stack_${stackLvl}`;
        if (group[stackKey] === undefined) group[stackKey] = 0;
        const polyIndex = group[stackKey] % group.polygons.length;
        const targetPoly = group.polygons[polyIndex];
        x = targetPoly.cx; z = targetPoly.cz; angle = targetPoly.angle;
        group[stackKey]++;
      }
      result.push({ ...container, x, y, z, angle, is40 });
    });
    return result;
  }, [slots, containers, center]);

  if (loading) {
    return <div className={`screen-message ${isDark ? "dark" : "light"}`}>Loading Live 3D Engine…</div>;
  }

  return (
    <div className={`app-container ${isDark ? "theme-dark" : "theme-light"}`}>
      <div className="ui-overlay">
        <div className="ui-header">
          <h1>Logistics 3D Yard</h1>
              <p
            className="subtitle"
            onClick={() => setShowInterior(true)}
            style={{ cursor: "pointer" }}
          >
            {slots.length} Yard Slots | {containers.length} Containers | {WAREHOUSE_DATA.length} Warehouses
          </p>
          <div style={{ fontSize: "12px", marginTop: "5px", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#10B981", borderRadius: "50%", boxShadow: "0 0 5px #10B981" }} />
            API Live • Last Sync: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="ui-controls-group">
          <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle Theme">
            {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <div className="ui-zoom-controls">
            <button onClick={() => setZoomAction("in")} title="Zoom In">+</button>
            <button onClick={() => setZoomAction("out")} title="Zoom Out">−</button>
          </div>
        </div>

        {selectedItem && (
          <div className="ui-info-card fade-in" style={{ background: isDark ? "rgba(30,41,59,0.9)" : "rgba(255,255,255,0.9)", padding: "15px", borderRadius: "8px", marginTop: "20px" }}>
            <div className="card-header" style={{ fontSize: "12px", opacity: 0.7 }}>
              {selectedItem.size ? "Container Details" : "Selected Yard Slot"}
            </div>
            <h3 style={{ margin: "5px 0" }}>{selectedItem.id || selectedItem.originalData?.ID || selectedItem._rawKey}</h3>
            <div className="card-detail" style={{ fontSize: "14px" }}>
              {selectedItem.size ? (
                <>
                  <div style={{ marginBottom: "4px" }}>Size: <strong>{selectedItem.originalData?.CTR_SIZE} FT</strong></div>
                  <div style={{ marginBottom: "4px" }}>Location: <strong>{selectedItem._rawKey || selectedItem.loc}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Load Status: <strong>{selectedItem.originalData?.LDD_MT_FLG === "E" ? "Empty" : "Loaded"}</strong></div>
                  <div style={{ marginBottom: "4px" }}>Stack Level: <strong>{selectedItem.stack} ({selectedItem.originalData?.HEIGHT})</strong></div>
                  <div style={{ marginBottom: "4px" }}>Shipping Line: <strong>{selectedItem.originalData?.SLINE_CD}</strong></div>
                </>
              ) : (
                <div>Path Vertices: <strong>{selectedItem.polygon?.length}</strong></div>
              )}
            </div>
          </div>
        )}

        {/* Updated Legend with All Additions */}
        <div className="ui-legend" style={{ background: isDark ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.8)", padding: "15px", borderRadius: "8px", position: "absolute", bottom: "20px", left: "20px" }}>
          <h4 style={{ margin: "0 0 10px 0" }}>Map Legend</h4>
          <div className="legend-row" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}><div style={{ width: "15px", height: "15px", background: "#38BDF8", marginRight: "10px" }}></div><span>Head Office</span></div>
          <div className="legend-row" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}><div style={{ width: "15px", height: "15px", background: "#065F46", marginRight: "10px" }}></div><span>Terminal Gates</span></div>
          <div className="legend-row" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}><div style={{ width: "15px", height: "15px", background: "#E6C280", marginRight: "10px" }}></div><span>Boundary Wall</span></div>
          <div className="legend-row" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}><div style={{ width: "15px", height: "15px", background: isDark ? "#94A3B8" : "#E2E8F0", border: "1px solid #94A3B8", marginRight: "10px" }}></div><span>Warehouse</span></div>
          <div className="legend-row" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}><div style={{ width: "15px", height: "15px", background: "#71717A", border: "2px dashed #FACC15", marginRight: "10px" }}></div><span>Parking Area</span></div>
          <div className="legend-row" style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}><div style={{ width: "15px", height: "15px", background: "#EA580C", marginRight: "10px" }}></div><span>RST Reach Stacker</span></div>
        </div>
      </div>

      <Canvas camera={{ position: [0, 400, 400], fov: 45 }} shadows>
        <color attach="background" args={[isDark ? "#0f172a" : "#e2e8f0"]} />
        <CameraZoomHandler zoomAction={zoomAction} setZoomAction={setZoomAction} />

        <ambientLight intensity={0.6} />
        <hemisphereLight skyColor={isDark ? "#1a3a5a" : "#add8e6"} groundColor="#3a3a3a" intensity={0.4} />
        <directionalLight position={[100, 300, 100]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-100, 100, -100]} intensity={0.5} />
        <pointLight position={[0, 200, 0]} intensity={0.3} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[10000, 10000]} />
          <meshStandardMaterial color={isDark ? "#1e293b" : "#f0f2f5"} roughness={1} />
        </mesh>

        <MapControls enableDamping={true} dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} minDistance={20} maxDistance={1500} />

        {/* Existing Infrastructure */}
        <BoundaryWall3D center={center} isDark={isDark} />
        <HeadOffice3D center={center} isDark={isDark} />
        <InGate3D center={center} isDark={isDark} />
        <OutGate3D center={center} isDark={isDark} />
        <ParkingArea3D center={center} isDark={isDark} />

        {/* Restored Path & Canteen */}
        <PathArea3D center={center} />
        <Canteen3D center={center} isDark={isDark} />

        {/* Slots */}
        {slots.map((slot, idx) => (
          <Slot3D key={`slot-${idx}`} slot={slot} center={center} isDark={isDark} onClick={setSelectedItem} />
        ))}

        {/* Containers */}
        {placedContainers.map((container, idx) => (
          <Container3D key={`container-${container.id}-${idx}`} data={container} isDark={isDark} onClick={setSelectedItem} />
        ))}

        {/* Warehouses */}
        {WAREHOUSE_DATA.map((wh, idx) => (
          <Warehouse3D key={`wh-${idx}`} data={wh} center={center} isDark={isDark} />
        ))}

        {/* Railway */}
        {useMemo(() => {
          const lngScale = Math.cos((center.lat * Math.PI) / 180);
          const pts = TRACK_COORDS.map((c) => ({
            x: (c[1] - center.lng) * LAT_TO_METERS * lngScale, z: -(c[0] - center.lat) * LAT_TO_METERS,
          }));
          return pts.slice(0, -1).map((p1, i) => {
            const p2 = pts[i + 1];
            const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
            return <TrackSegment key={i} cx={(p1.x + p2.x) / 2} cz={(p1.z + p2.z) / 2} len={len} angle={Math.atan2(p2.x - p1.x, p2.z - p1.z)} isDark={isDark} />;
          });
        }, [center, isDark])}

        {/* RTG Cranes */}
        {CRANE_COORDS.map((crane, idx) => (
          <Crane3D key={`crane-${idx}`} lat={crane.lat} lng={crane.lng} type={crane.type} center={center} isDark={isDark} />
        ))}

        {/* NEW: RST Reach Stackers */}
        {RST_MACHINES.map((rst, idx) => (
          <ReachStacker3D key={`rst-${idx}`} lat={rst.lat} lng={rst.lng} angle={rst.angle} center={center} isDark={isDark} />
        ))}

      </Canvas>
    </div>
  );
}

export default App;