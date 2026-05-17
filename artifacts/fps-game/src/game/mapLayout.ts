import type { Vec3, Team, BotRole } from "./battleTypes";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BuildingLayout {
  glb:   string;
  pos:   Vec3;
  rotY:  number;
  scale: number;
  halfW: number;
  halfD: number;
}

export interface PropLayout {
  glb:   string;
  pos:   Vec3;
  rotY:  number;
  scale: number;
}

export interface BotSpawn {
  id:   string;
  pos:  Vec3;
  yaw:  number;
  team: Team;
  role: BotRole;
}

export interface ColliderBox {
  pos:   Vec3;
  halfW: number;
  halfD: number;
}

export interface MapLayout {
  buildings:      BuildingLayout[];
  props:          PropLayout[];
  colliders:      ColliderBox[];
  coreBoxSpawns:  { pos: Vec3; color: string }[];
  playerSpawn:    Vec3;
  playerSpawnYaw: number;
  blueMachinePos: Vec3;
  redMachinePos:  Vec3;
  botSpawns:      BotSpawn[];
}

// ─── Map definition ───────────────────────────────────────────────────────────
// playerSpawnYaw: facing toward map center (0,0) from spawn (-44,-44)
// atan2(44, 44) ≈ Math.PI/4
const MAP_LAYOUT: MapLayout = {
  playerSpawn:    { x: -44, y: 0, z: -44 },
  playerSpawnYaw: Math.PI / 4,
  blueMachinePos: { x: -40, y: 0, z: -38 },
  redMachinePos:  { x:  40, y: 0, z:  38 },

  buildings: [
    // halfW/halfD increased to ~160% of original to match actual GLB footprints
    // ── Central cover ──────────────────────────────────────────────────────
    { glb: "building-type-a.glb",       pos: { x:  2,   y: 0, z:  2   }, rotY: 0,             scale: 1,   halfW: 8,  halfD: 8  },
    { glb: "building-type-d.glb",       pos: { x:  18,  y: 0, z: -8   }, rotY: Math.PI / 2,   scale: 1,   halfW: 9,  halfD: 8  },
    { glb: "building-type-g.glb",       pos: { x: -18,  y: 0, z:  8   }, rotY: 0,             scale: 1,   halfW: 8,  halfD: 8  },
    { glb: "building-a.glb",            pos: { x:  6,   y: 0, z:  22  }, rotY: Math.PI,       scale: 1,   halfW: 9,  halfD: 9  },
    { glb: "building-b.glb",            pos: { x: -8,   y: 0, z: -22  }, rotY: 0,             scale: 1,   halfW: 9,  halfD: 9  },
    { glb: "building-type-j.glb",       pos: { x:  26,  y: 0, z:  16  }, rotY: -Math.PI / 4,  scale: 1,   halfW: 9,  halfD: 9  },
    { glb: "building-type-k.glb",       pos: { x: -26,  y: 0, z: -16  }, rotY: Math.PI / 4,   scale: 1,   halfW: 9,  halfD: 9  },
    { glb: "building-skyscraper-a.glb", pos: { x:  13,  y: 0, z: -12  }, rotY: 0,             scale: 1,   halfW: 7,  halfD: 7  },
    { glb: "building-skyscraper-b.glb", pos: { x: -13,  y: 0, z:  12  }, rotY: Math.PI,       scale: 1,   halfW: 7,  halfD: 7  },
    // ── Mid flanks ────────────────────────────────────────────────────────
    { glb: "building-type-n.glb",       pos: { x: -28,  y: 0, z:  10  }, rotY: Math.PI / 2,   scale: 1,   halfW: 8,  halfD: 9  },
    { glb: "building-type-p.glb",       pos: { x:  28,  y: 0, z: -10  }, rotY: -Math.PI / 2,  scale: 1,   halfW: 8,  halfD: 9  },
    // ── Base area structures ───────────────────────────────────────────────
    { glb: "building-type-c.glb",       pos: { x: -30,  y: 0, z: -28  }, rotY: 0,             scale: 1,   halfW: 8,  halfD: 8  },
    { glb: "building-type-f.glb",       pos: { x:  30,  y: 0, z:  28  }, rotY: Math.PI,       scale: 1,   halfW: 8,  halfD: 8  },
    { glb: "building-c.glb",            pos: { x: -32,  y: 0, z: -20  }, rotY: Math.PI / 2,   scale: 1,   halfW: 9,  halfD: 9  },
    { glb: "building-d.glb",            pos: { x:  32,  y: 0, z:  20  }, rotY: -Math.PI / 2,  scale: 1,   halfW: 9,  halfD: 9  },
  ],

  props: [
    { glb: "tree.glb",       pos: { x: -10, y: 0, z:  32  }, rotY: 0,          scale: 1.5 },
    { glb: "tree.glb",       pos: { x:  10, y: 0, z: -32  }, rotY: 0.5,        scale: 1.3 },
    { glb: "tree.glb",       pos: { x:  35, y: 0, z: -5   }, rotY: 1.1,        scale: 1.2 },
    { glb: "tree.glb",       pos: { x: -35, y: 0, z:  5   }, rotY: 0.8,        scale: 1.2 },
    { glb: "oak_trees.glb",  pos: { x: -32, y: 0, z:  12  }, rotY: 0,          scale: 1   },
    { glb: "oak_trees.glb",  pos: { x:  32, y: 0, z: -12  }, rotY: Math.PI,    scale: 1   },
    { glb: "rocks_set2.glb", pos: { x:  11, y: 0, z:   9  }, rotY: 0.3,        scale: 1.0 },
    { glb: "rocks_set2.glb", pos: { x: -11, y: 0, z:  -9  }, rotY: 1.2,        scale: 1.0 },
    { glb: "rocks_set2.glb", pos: { x:  34, y: 0, z: -24  }, rotY: 0,          scale: 0.8 },
    { glb: "rocks_set2.glb", pos: { x: -34, y: 0, z:  24  }, rotY: 2.0,        scale: 0.8 },
    { glb: "rocks_set2.glb", pos: { x:   0, y: 0, z:  17  }, rotY: 0.6,        scale: 1.0 },
    { glb: "rocks_set2.glb", pos: { x:   0, y: 0, z: -17  }, rotY: 1.8,        scale: 1.0 },
  ],

  // ── Extra collision volumes for props that can be walked into ────────────────
  colliders: [
    { pos: { x:  11, y: 0, z:   9  }, halfW: 3.5, halfD: 3.5 },
    { pos: { x: -11, y: 0, z:  -9  }, halfW: 3.5, halfD: 3.5 },
    { pos: { x:  34, y: 0, z: -24  }, halfW: 2.5, halfD: 2.5 },
    { pos: { x: -34, y: 0, z:  24  }, halfW: 2.5, halfD: 2.5 },
    { pos: { x:   0, y: 0, z:  17  }, halfW: 3.0, halfD: 3.0 },
    { pos: { x:   0, y: 0, z: -17  }, halfW: 3.0, halfD: 3.0 },
    { pos: { x: -32, y: 0, z:  12  }, halfW: 4.0, halfD: 4.0 },
    { pos: { x:  32, y: 0, z: -12  }, halfW: 4.0, halfD: 4.0 },
  ],

  coreBoxSpawns: [
    { pos: { x: -5,  y: 0.3, z:  0   }, color: "red"    },
    { pos: { x:  5,  y: 0.3, z:  0   }, color: "blue"   },
    { pos: { x:  0,  y: 0.3, z: -6   }, color: "yellow" },
    { pos: { x:  0,  y: 0.3, z:  6   }, color: "green"  },
    { pos: { x:  15, y: 0.3, z:  9   }, color: "purple" },
    { pos: { x: -15, y: 0.3, z: -9   }, color: "black"  },
    { pos: { x:  24, y: 0.3, z: -19  }, color: "red"    },
    { pos: { x: -24, y: 0.3, z:  19  }, color: "blue"   },
    { pos: { x:  -6, y: 0.3, z:  26  }, color: "yellow" },
    { pos: { x:   6, y: 0.3, z: -26  }, color: "green"  },
    { pos: { x:  32, y: 0.3, z:  6   }, color: "purple" },
    { pos: { x: -32, y: 0.3, z: -6   }, color: "black"  },
  ],

  // All yaws pointing toward map center (0,0):
  // blue team at (-42~-48, -38~-48) corner → yaw ≈ PI/4 (northeast)
  // red  team at ( 42~ 48,  38~ 48) corner → yaw ≈ -3*PI/4 (southwest)
  botSpawns: [
    { id: "ally1",  pos: { x: -46, y: 0, z: -40 }, yaw:  Math.PI / 4,        team: "blue", role: "leader"   },
    { id: "ally2",  pos: { x: -42, y: 0, z: -48 }, yaw:  Math.PI / 4,        team: "blue", role: "follower" },
    { id: "ally3",  pos: { x: -50, y: 0, z: -44 }, yaw:  Math.PI / 4,        team: "blue", role: "follower" },
    { id: "ally4",  pos: { x: -48, y: 0, z: -36 }, yaw:  Math.PI / 4,        team: "blue", role: "follower" },
    { id: "enemy1", pos: { x:  46, y: 0, z:  40  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "leader"   },
    { id: "enemy2", pos: { x:  42, y: 0, z:  48  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "follower" },
    { id: "enemy3", pos: { x:  50, y: 0, z:  44  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "follower" },
    { id: "enemy4", pos: { x:  48, y: 0, z:  36  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "follower" },
    { id: "enemy5", pos: { x:  44, y: 0, z:  50  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "follower" },
  ],
};

export default MAP_LAYOUT;
