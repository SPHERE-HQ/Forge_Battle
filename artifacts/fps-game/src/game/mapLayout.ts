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

export interface MapLayout {
  buildings:      BuildingLayout[];
  props:          PropLayout[];
  coreBoxSpawns:  { pos: Vec3; color: string }[];
  playerSpawn:    Vec3;
  blueMachinePos: Vec3;
  redMachinePos:  Vec3;
  botSpawns:      BotSpawn[];
}

// ─── Map definition ───────────────────────────────────────────────────────────
const MAP_LAYOUT: MapLayout = {
  playerSpawn:    { x: -42, y: 0, z: -42 },
  blueMachinePos: { x: -38, y: 0, z: -36 },
  redMachinePos:  { x:  38, y: 0, z:  36 },

  buildings: [
    // ── Central cover ──────────────────────────────────────────────────────
    { glb: "building-type-a.glb",       pos: { x:  2,   y: 0, z:  2   }, rotY: 0,             scale: 1,   halfW: 4,  halfD: 4  },
    { glb: "building-type-d.glb",       pos: { x:  18,  y: 0, z: -8   }, rotY: Math.PI / 2,   scale: 1,   halfW: 5,  halfD: 4  },
    { glb: "building-type-g.glb",       pos: { x: -18,  y: 0, z:  8   }, rotY: 0,             scale: 1,   halfW: 4,  halfD: 4  },
    { glb: "building-a.glb",            pos: { x:  6,   y: 0, z:  22  }, rotY: Math.PI,       scale: 1,   halfW: 5,  halfD: 5  },
    { glb: "building-b.glb",            pos: { x: -8,   y: 0, z: -22  }, rotY: 0,             scale: 1,   halfW: 5,  halfD: 5  },
    { glb: "building-type-j.glb",       pos: { x:  26,  y: 0, z:  16  }, rotY: -Math.PI / 4,  scale: 1,   halfW: 5,  halfD: 5  },
    { glb: "building-type-k.glb",       pos: { x: -26,  y: 0, z: -16  }, rotY: Math.PI / 4,   scale: 1,   halfW: 5,  halfD: 5  },
    { glb: "building-skyscraper-a.glb", pos: { x:  13,  y: 0, z: -12  }, rotY: 0,             scale: 1,   halfW: 4,  halfD: 4  },
    { glb: "building-skyscraper-b.glb", pos: { x: -13,  y: 0, z:  12  }, rotY: Math.PI,       scale: 1,   halfW: 4,  halfD: 4  },
    // ── Mid flanks ────────────────────────────────────────────────────────
    { glb: "building-type-n.glb",       pos: { x: -28,  y: 0, z:  10  }, rotY: Math.PI / 2,   scale: 1,   halfW: 4,  halfD: 5  },
    { glb: "building-type-p.glb",       pos: { x:  28,  y: 0, z: -10  }, rotY: -Math.PI / 2,  scale: 1,   halfW: 4,  halfD: 5  },
    // ── Base area structures ───────────────────────────────────────────────
    { glb: "building-type-c.glb",       pos: { x: -30,  y: 0, z: -28  }, rotY: 0,             scale: 1,   halfW: 4,  halfD: 4  },
    { glb: "building-type-f.glb",       pos: { x:  30,  y: 0, z:  28  }, rotY: Math.PI,       scale: 1,   halfW: 4,  halfD: 4  },
    { glb: "building-c.glb",            pos: { x: -34,  y: 0, z: -20  }, rotY: Math.PI / 2,   scale: 1,   halfW: 5,  halfD: 5  },
    { glb: "building-d.glb",            pos: { x:  34,  y: 0, z:  20  }, rotY: -Math.PI / 2,  scale: 1,   halfW: 5,  halfD: 5  },
  ],

  props: [
    { glb: "tree.glb",       pos: { x: -10, y: 0, z:  32  }, rotY: 0,          scale: 1.5 },
    { glb: "tree.glb",       pos: { x:  10, y: 0, z: -32  }, rotY: 0.5,        scale: 1.3 },
    { glb: "tree.glb",       pos: { x:  35, y: 0, z: -5   }, rotY: 1.1,        scale: 1.2 },
    { glb: "tree.glb",       pos: { x: -35, y: 0, z:  5   }, rotY: 0.8,        scale: 1.2 },
    { glb: "oak_trees.glb",  pos: { x: -32, y: 0, z:  12  }, rotY: 0,          scale: 1   },
    { glb: "oak_trees.glb",  pos: { x:  32, y: 0, z: -12  }, rotY: Math.PI,    scale: 1   },
    { glb: "rocks_set2.glb", pos: { x:   8, y: 0, z:   6  }, rotY: 0.3,        scale: 1.5 },
    { glb: "rocks_set2.glb", pos: { x:  -8, y: 0, z:  -6  }, rotY: 1.2,        scale: 1.2 },
    { glb: "rocks_set2.glb", pos: { x:  32, y: 0, z: -22  }, rotY: 0,          scale: 1   },
    { glb: "rocks_set2.glb", pos: { x: -32, y: 0, z:  22  }, rotY: 2.0,        scale: 1   },
    { glb: "rocks_set2.glb", pos: { x:   0, y: 0, z:  14  }, rotY: 0.6,        scale: 1.3 },
    { glb: "rocks_set2.glb", pos: { x:   0, y: 0, z: -14  }, rotY: 1.8,        scale: 1.3 },
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

  botSpawns: [
    { id: "ally1",  pos: { x: -40, y: 0, z: -35 }, yaw:  0.8,  team: "blue", role: "leader"   },
    { id: "ally2",  pos: { x: -36, y: 0, z: -46 }, yaw:  0.5,  team: "blue", role: "follower" },
    { id: "ally3",  pos: { x: -46, y: 0, z: -40 }, yaw:  0.6,  team: "blue", role: "follower" },
    { id: "ally4",  pos: { x: -38, y: 0, z: -50 }, yaw:  0.7,  team: "blue", role: "follower" },
    { id: "enemy1", pos: { x:  40, y: 0, z:  35  }, yaw: -2.3,  team: "red",  role: "leader"   },
    { id: "enemy2", pos: { x:  36, y: 0, z:  46  }, yaw: -2.5,  team: "red",  role: "follower" },
    { id: "enemy3", pos: { x:  46, y: 0, z:  40  }, yaw: -2.4,  team: "red",  role: "follower" },
    { id: "enemy4", pos: { x:  38, y: 0, z:  50  }, yaw: -2.6,  team: "red",  role: "follower" },
    { id: "enemy5", pos: { x:  42, y: 0, z:  42  }, yaw: -2.3,  team: "red",  role: "follower" },
  ],
};

export default MAP_LAYOUT;
