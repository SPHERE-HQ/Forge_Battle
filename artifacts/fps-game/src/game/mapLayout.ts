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

  buildings: [],

  props: [],

  colliders: [],

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
  // Blue team starts with NO bots — player crafts allies at the machine
  // Red team starts with 1 leader (enemy "player") + 1 follower
  botSpawns: [
    { id: "enemy1", pos: { x:  46, y: 0, z:  40  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "leader"   },
    { id: "enemy2", pos: { x:  42, y: 0, z:  48  }, yaw: -3 * Math.PI / 4,   team: "red",  role: "follower" },
  ],
};

export default MAP_LAYOUT;
