/**
 * PIN://CORE Matter.js Physics Wrapper
 * Handles world boundary constraints, precision sub-stepping, engine ticks, and flippers constraints.
 */

export class PhysicsEngine {
    constructor() {
        const { Engine, World, Runner, Events } = Matter;
        this.engine = Engine.create({
            gravity: { x: 0, y: 1.0, scale: 0.001 } // Standard downward gravity
        });
        this.world = this.engine.world;
        this.runner = Runner.create();

        this.flipperConstraints = [];
        this.registeredBodies = new Map();

        this.setupCollisions();
    }

    setupCollisions() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const entityA = this.registeredBodies.get(pair.bodyA.id);
                const entityB = this.registeredBodies.get(pair.bodyB.id);

                if (entityA && entityA.collision) {
                    entityA.collision(entityB || pair.bodyB);
                }
                if (entityB && entityB.collision) {
                    entityB.collision(entityA || pair.bodyA);
                }
            }
        });
    }

    addBody(body, entity) {
        Matter.World.add(this.world, body);
        this.registeredBodies.set(body.id, entity);
    }

    removeBody(body) {
        Matter.World.remove(this.world, body);
        this.registeredBodies.delete(body.id);
    }

    clearWorld() {
        Matter.World.clear(this.world, false);
        this.registeredBodies.clear();
        this.flipperConstraints = [];
    }

    update(deltaTime) {
        // High-precision sub-stepping (e.g. 8 sub-steps to prevent ball tunneling at high speeds)
        const subSteps = 8;
        const subDelta = Math.min(deltaTime, 32) / subSteps;
        for (let i = 0; i < subSteps; i++) {
            Matter.Engine.update(this.engine, subDelta);
        }
    }

    // Creates static world borders to keep the ball inside the play area
    createBorders(width, height) {
        const { Bodies, World } = Matter;
        const thickness = 100;

        const topWall = Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, { isStatic: true });
        const leftWall = Bodies.rectangle(-thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true, restitution: 0.6 });
        const rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + thickness * 2, { isStatic: true, restitution: 0.6 });
        const bottomWall = Bodies.rectangle(width / 2, height + thickness / 2, width + thickness * 2, thickness, { isStatic: true, label: "drain" });

        World.add(this.world, [topWall, leftWall, rightWall, bottomWall]);

        // Return drain bottom body for collision detection
        return bottomWall;
    }
}
export const physics = new PhysicsEngine();
