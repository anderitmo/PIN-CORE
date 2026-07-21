/**
 * PIN://CORE 6-Sector Campaign Levels System & Objectives
 * Level details, layout constructs, bumpers placements, custom objectives & Boss triggers.
 */

export const LEVEL_SECTORS = [
    {
        id: 1,
        name: "BOOT",
        subtitle: "Tutorial & Initial Boot Initialization",
        narrative: "BOOT SEQUENCE...",
        width: 800,
        height: 840,
        ballCount: 3,
        objectives: [
            { id: "nodes_3", text: "Ativar todos os 3 Nós (Bumpers)", target: 3, progress: 0, completed: false },
            { id: "score_10k", text: "Alcançar 10.000 pontos", target: 10000, progress: 0, completed: false }
        ],
        bumpers: [
            { x: 300, y: 250, radius: 28, type: "normal" },
            { x: 500, y: 250, radius: 28, type: "normal" },
            { x: 400, y: 380, radius: 35, type: "multiplier" }
        ],
        obstacles: [],
        boss: { name: "SECURE_BOOT_FIREWALL", hp: 1200, x: 400, y: 150 }
    },
    {
        id: 2,
        name: "MEMORY",
        subtitle: "Sector 02 — Data Buffer Restoration",
        narrative: "MEMORY ONLINE",
        width: 800,
        height: 840,
        ballCount: 3,
        objectives: [
            { id: "bumpers_hit", text: "Acertar Bumpers Explosivos 10 vezes", target: 10, progress: 0, completed: false },
            { id: "score_50k", text: "Alcançar 50.000 pontos", target: 50000, progress: 0, completed: false }
        ],
        bumpers: [
            { x: 250, y: 200, radius: 25, type: "explosive" },
            { x: 550, y: 200, radius: 25, type: "explosive" },
            { x: 400, y: 280, radius: 30, type: "normal" },
            { x: 250, y: 380, radius: 25, type: "multiplier" },
            { x: 550, y: 380, radius: 25, type: "multiplier" }
        ],
        obstacles: [],
        boss: { name: "CORRUPTED_MEMORY_ALLOCATOR", hp: 1800, x: 400, y: 140 }
    },
    {
        id: 3,
        name: "NETWORK",
        subtitle: "Sector 03 — Socket Ports Teleportation",
        narrative: "NETWORK RESTORED",
        width: 800,
        height: 840,
        ballCount: 3,
        objectives: [
            { id: "use_portal", text: "Usar Portais 4 vezes", target: 4, progress: 0, completed: false },
            { id: "score_100k", text: "Alcançar 100.000 pontos", target: 100000, progress: 0, completed: false }
        ],
        bumpers: [
            { x: 400, y: 250, radius: 30, type: "magnetic" },
            { x: 200, y: 350, radius: 25, type: "normal" },
            { x: 600, y: 350, radius: 25, type: "normal" }
        ],
        portals: [
            { x: 150, y: 200, targetX: 650, targetY: 450, label: "SOCKET_A" },
            { x: 650, y: 200, targetX: 150, targetY: 450, label: "SOCKET_B" }
        ],
        obstacles: [],
        boss: { name: "SENTINEL_ROUTING_DAEMON", hp: 2500, x: 400, y: 130 }
    },
    {
        id: 4,
        name: "QUANTUM",
        subtitle: "Sector 04 — Gravity Phase Dilator",
        narrative: "UNKNOWN PROCESS FOUND",
        width: 800,
        height: 840,
        ballCount: 3,
        objectives: [
            { id: "temporal_hit", text: "Ativar Bumper Temporal 3 vezes", target: 3, progress: 0, completed: false },
            { id: "score_250k", text: "Alcançar 250.000 pontos", target: 250000, progress: 0, completed: false }
        ],
        bumpers: [
            { x: 400, y: 200, radius: 32, type: "temporal" },
            { x: 250, y: 320, radius: 28, type: "explosive" },
            { x: 550, y: 320, radius: 28, type: "explosive" },
            { x: 400, y: 400, radius: 30, type: "multiplier" }
        ],
        portals: [],
        boss: { name: "QUANTUM_CORE_ENTANGLER", hp: 3500, x: 400, y: 140 }
    },
    {
        id: 5,
        name: "SECURITY",
        subtitle: "Sector 05 — Defense Laser Perimeter",
        narrative: "ACCESS DENIED",
        width: 800,
        height: 840,
        ballCount: 3,
        objectives: [
            { id: "break_shields", text: "Destruir os 3 Escudos do Sistema", target: 3, progress: 0, completed: false },
            { id: "score_500k", text: "Alcançar 500.000 pontos", target: 500000, progress: 0, completed: false }
        ],
        bumpers: [
            // Destructible Shield items
            { x: 280, y: 280, radius: 22, type: "shield", params: { health: 3 } },
            { x: 400, y: 280, radius: 22, type: "shield", params: { health: 3 } },
            { x: 520, y: 280, radius: 22, type: "shield", params: { health: 3 } },
            { x: 400, y: 180, radius: 35, type: "magnetic" }
        ],
        portals: [],
        boss: { name: "BLACK_VIRUS_DECRYPTOR", hp: 5000, x: 400, y: 120 }
    },
    {
        id: 6,
        name: "CORE",
        subtitle: "Sector 06 — Central Control Unit Mainframe",
        narrative: "CORE INTEGRITY 87%",
        width: 800,
        height: 840,
        ballCount: 4,
        objectives: [
            { id: "core_all", text: "Ativar todos os Bumpers Centrais", target: 4, progress: 0, completed: false },
            { id: "score_1m", text: "Alcançar 1.000.000 de pontos", target: 1000000, progress: 0, completed: false }
        ],
        bumpers: [
            { x: 250, y: 220, radius: 25, type: "explosive" },
            { x: 550, y: 220, radius: 25, type: "explosive" },
            { x: 400, y: 300, radius: 32, type: "temporal" },
            { x: 300, y: 400, radius: 26, type: "magnetic" },
            { x: 500, y: 400, radius: 26, type: "magnetic" }
        ],
        portals: [
            { x: 120, y: 180, targetX: 680, targetY: 480, label: "CORE_GATE_A" },
            { x: 680, y: 180, targetX: 120, targetY: 480, label: "CORE_GATE_B" }
        ],
        boss: { name: "THE_FINAL_AI_MAINFRAME", hp: 8000, x: 400, y: 130 }
    }
];

export class LevelsManager {
    constructor() {
        this.sectors = LEVEL_SECTORS;
    }

    getSector(id) {
        return this.sectors.find(s => s.id === id) || this.sectors[0];
    }
}
export const levels = new LevelsManager();
