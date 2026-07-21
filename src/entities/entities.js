/**
 * PIN://CORE Game Entities Module
 * Incorporates Ball (with skins, customized physics attributes & trailing particles),
 * Flippers (Normal, Magnetic, Turbo, Quantum), Bumpers (Normal, Multiplier, Explosive, Magnetic, Portal, Temporal, Shield, Laser),
 * Obstacles, and Boss entities.
 */

import { physics } from '../physics/physics.js';
import { audio } from '../audio/audio.js';

// Particle helper for explosion/spark/glow trails
export class Particle {
    constructor(x, y, color, size, vx, vy, maxLife = 40) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.life = maxLife;
        this.maxLife = maxLife;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 1. BALL ENTITY
export class Ball {
    constructor(x, y, radius = 12, type = "normal", skin = "default") {
        this.radius = radius;
        this.type = type;
        this.skin = skin;
        this.trail = [];
        this.destroyed = false;

        // Custom mass / physics modifiers depending on chosen Ball unlocks
        let density = 0.001;
        let restitution = 0.5;
        let friction = 0.01;

        if (type === "heavy") {
            density = 0.003; // Heavy steel-like physics
            restitution = 0.3;
        } else if (type === "plasma") {
            density = 0.0008; // High speed
            restitution = 0.7;
        } else if (type === "ghost") {
            density = 0.0007;
            restitution = 0.6;
        } else if (type === "quantum") {
            density = 0.0009;
            restitution = 0.55;
        } else if (type === "cube" || type === "triangle") {
            friction = 0.05;
        }

        const { Bodies } = Matter;

        // Cube ball type creates square body, Triangle creates poly, otherwise normal circle
        if (type === "cube") {
            this.body = Bodies.rectangle(x, y, radius * 1.8, radius * 1.8, {
                density, restitution, friction, label: "ball"
            });
        } else if (type === "triangle") {
            this.body = Bodies.polygon(x, y, 3, radius * 1.2, {
                density, restitution, friction, label: "ball"
            });
        } else {
            this.body = Bodies.circle(x, y, radius, {
                density, restitution, friction, label: "ball"
            });
        }

        physics.addBody(this.body, this);
    }

    update(deltaTime, particles) {
        if (this.destroyed) return;

        // Save trail for visual afterimages
        const pos = this.body.position;
        this.trail.push({ x: pos.x, y: pos.y });
        if (this.trail.length > 12) {
            this.trail.shift();
        }

        // Emit slight spark particles continuously based on ball velocity/type
        const speed = Matter.Vector.magnitude(this.body.velocity);
        if (speed > 1.5 && Math.random() < 0.35) {
            let col = "#00f0ff";
            if (this.type === "plasma") col = "#ff007f";
            if (this.type === "ghost") col = "#39ff14";
            if (this.type === "heavy") col = "#ffffff";
            particles.push(new Particle(
                pos.x, pos.y, col, Math.random() * 3 + 1,
                (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5,
                30
            ));
        }

        // Apply magnetic forces or portals handling inside actual game update
    }

    draw(ctx) {
        if (this.destroyed) return;

        const pos = this.body.position;
        const angle = this.body.angle;

        // Draw Trails
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const p = this.trail[i];
            const ratio = i / this.trail.length;
            ctx.globalAlpha = ratio * 0.15;
            ctx.fillStyle = this.getSkinColor();
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.radius * (0.4 + ratio * 0.6), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Draw Main Body
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Core visual style depending on selected skin
        ctx.shadowColor = this.getSkinColor();
        ctx.shadowBlur = 12;
        ctx.strokeStyle = this.getSkinColor();
        ctx.lineWidth = 3;
        ctx.fillStyle = "#050505";

        if (this.type === "cube") {
            ctx.beginPath();
            ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
            ctx.fill();
            ctx.stroke();
            // Draw cross indicator
            ctx.beginPath();
            ctx.moveTo(-this.radius + 3, 0); ctx.lineTo(this.radius - 3, 0);
            ctx.moveTo(0, -this.radius + 3); ctx.lineTo(0, this.radius - 3);
            ctx.stroke();
        } else if (this.type === "triangle") {
            ctx.beginPath();
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, this.radius);
            ctx.lineTo(-this.radius, this.radius);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Circle
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner styling depending on skin/ball type
            ctx.fillStyle = this.getSkinColor();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getSkinColor() {
        if (this.skin === "neon_magenta" || this.type === "plasma") return "#ff007f";
        if (this.skin === "neon_green" || this.type === "ghost") return "#39ff14";
        if (this.skin === "gold_cyber") return "#ffd700";
        if (this.skin === "glitch_core") return "#ff00ff";
        return "#00f0ff"; // Default cyan neon
    }

    collision(other) {
        // Trigger generic click or charge sounds on heavy hits
        if (other && other.body && other.body.label !== "drain") {
            const speed = Matter.Vector.magnitude(this.body.velocity);
            if (speed > 5) {
                audio.playSFX("pulse");
            } else {
                audio.playSFX("click");
            }
        }
    }

    destroy() {
        this.destroyed = true;
        physics.removeBody(this.body);
    }
}

// 2. FLIPPER ENTITY
export class Flipper {
    constructor(x, y, length = 120, height = 20, isLeft = true, type = "normal") {
        this.x = x;
        this.y = y;
        this.length = length;
        this.height = height;
        this.isLeft = isLeft;
        this.type = type; // normal, magnetic, turbo, quantum
        this.active = false;

        const { Bodies, Body, Constraint, World } = Matter;

        // Flipper body shape
        const offset = length / 2;
        this.body = Bodies.rectangle(isLeft ? x + offset : x - offset, y, length, height, {
            density: 0.05,
            friction: 0.1,
            restitution: 0.1,
            label: isLeft ? "flipper_left" : "flipper_right"
        });

        // Hinge point for physical swing pivot
        this.pivot = Bodies.circle(x, y, 5, { isStatic: true, isSensor: true });

        // High stiffness pivot constraints keeping it pinned
        this.constraint = Constraint.create({
            bodyA: this.pivot,
            bodyB: this.body,
            pointA: { x: 0, y: 0 },
            pointB: { x: isLeft ? -offset : offset, y: 0 },
            stiffness: 1.0,
            length: 0
        });

        physics.addBody(this.body, this);
        physics.addBody(this.pivot, null);
        World.add(physics.world, this.constraint);

        // Rotation lock limit anchors (prevent over-rotation)
        const limitAng = 0.55; // Radians (~30 degrees)
        this.minAngle = isLeft ? -0.15 : -Math.PI + 0.15;
        this.maxAngle = isLeft ? limitAng : -Math.PI - limitAng;

        // Set initial orientation
        Body.setAngle(this.body, isLeft ? -0.15 : Math.PI + 0.15);
    }

    update(deltaTime) {
        const { Body } = Matter;
        // Apply torque / angular velocity to flip up or drop down
        const flipSpeed = 0.22;

        if (this.active) {
            // Swing Up
            if (this.isLeft) {
                if (this.body.angle < 0.55) {
                    Body.setAngularVelocity(this.body, flipSpeed);
                } else {
                    Body.setAngle(this.body, 0.55);
                    Body.setAngularVelocity(this.body, 0);
                }
            } else {
                if (this.body.angle > -Math.PI - 0.55) {
                    Body.setAngularVelocity(this.body, -flipSpeed);
                } else {
                    Body.setAngle(this.body, -Math.PI - 0.55);
                    Body.setAngularVelocity(this.body, 0);
                }
            }
        } else {
            // Fall back down
            if (this.isLeft) {
                if (this.body.angle > -0.15) {
                    Body.setAngularVelocity(this.body, -flipSpeed * 0.5);
                } else {
                    Body.setAngle(this.body, -0.15);
                    Body.setAngularVelocity(this.body, 0);
                }
            } else {
                if (this.body.angle < -Math.PI + 0.15) {
                    Body.setAngularVelocity(this.body, flipSpeed * 0.5);
                } else {
                    Body.setAngle(this.body, -Math.PI + 0.15);
                    Body.setAngularVelocity(this.body, 0);
                }
            }
        }

        // Apply TURBO features (instant extreme physical push) or magnetic lock in parent controller
    }

    draw(ctx) {
        const pos = this.body.position;
        const angle = this.body.angle;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);

        // Styling based on Flipper level/variant
        let color = "#00f0ff";
        if (this.type === "magnetic") color = "#ff007f";
        if (this.type === "turbo") color = "#39ff14";
        if (this.type === "quantum") color = "#ffd700";

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = "#050505";
        ctx.shadowColor = color;
        ctx.shadowBlur = this.active ? 15 : 6;

        ctx.beginPath();
        // Custom rounded capsule flipper shape
        ctx.roundRect(-this.length / 2, -this.height / 2, this.length, this.height, this.height / 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    setActive(active) {
        if (active && !this.active) {
            audio.playSFX("bass");
        }
        this.active = active;
    }

    collision(other) {
        // Boost reflection power on flipper collision if turbo type
        if (this.active && other && other.body && other.body.label === "ball") {
            let mult = 1.25;
            if (this.type === "turbo") mult = 1.95;
            if (this.type === "magnetic") mult = 0.85; // Grabs slightly

            Matter.Body.setVelocity(other.body, {
                x: other.body.velocity.x * mult,
                y: other.body.velocity.y * mult
            });
        }
    }

    destroy() {
        physics.removeBody(this.body);
        physics.removeBody(this.pivot);
        Matter.World.remove(physics.world, this.constraint);
    }
}

// 3. BUMPER ENTITY
export class Bumper {
    constructor(x, y, radius = 30, type = "normal", params = {}) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.type = type; // normal, multiplier, explosive, magnetic, portal, temporal, shield, laser
        this.params = params;
        this.activeTime = 0;
        this.hitScore = 100;
        this.health = params.health || null; // For Shield structures or target blocks
        this.maxHealth = this.health;

        const { Bodies } = Matter;
        this.body = Bodies.circle(x, y, radius, {
            isStatic: true,
            restitution: type === "explosive" ? 1.8 : 1.2,
            label: "bumper"
        });

        physics.addBody(this.body, this);
    }

    update(deltaTime) {
        if (this.activeTime > 0) {
            this.activeTime -= deltaTime;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        let color = "#00f0ff"; // cyan normal
        if (this.type === "multiplier") color = "#ffd700"; // yellow
        if (this.type === "explosive") color = "#ff007f"; // magenta
        if (this.type === "magnetic") color = "#ff00ff"; // violet
        if (this.type === "portal") color = "#00ffff";
        if (this.type === "temporal") color = "#00ffcc";
        if (this.type === "shield") color = "#39ff14"; // green
        if (this.type === "laser") color = "#ff3300";

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.fillStyle = this.activeTime > 0 ? color : "#050505";
        ctx.shadowColor = color;
        ctx.shadowBlur = this.activeTime > 0 ? 25 : 8;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner icon indicator details
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        if (this.type === "multiplier") {
            ctx.font = "bold 14px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("X", -4, 5);
        } else if (this.type === "explosive") {
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === "shield") {
            ctx.rect(-8, -4, 16, 8);
            ctx.stroke();
        } else {
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    collision(other) {
        if (other && other.body && other.body.label === "ball") {
            this.activeTime = 150; // trigger glowing reaction
            audio.playSFX("pulse");

            // Custom bounce effects based on type
            if (this.type === "explosive") {
                audio.playSFX("laser");
                // Launch ball extremely hard away
                const dir = Matter.Vector.sub(other.body.position, this.body.position);
                const norm = Matter.Vector.normalise(dir);
                Matter.Body.setVelocity(other.body, Matter.Vector.mult(norm, 18));
            }

            if (this.type === "temporal") {
                // Triggers temporal dilator / slow-motion in parent loop
                audio.playSFX("charge");
            }

            if (this.type === "shield" && this.health !== null) {
                this.health--;
                if (this.health <= 0) {
                    audio.playSFX("glitch");
                    this.destroy();
                }
            }
        }
    }

    destroy() {
        physics.removeBody(this.body);
    }
}

// 4. PORTAL ENTITY
export class Portal {
    constructor(x, y, targetX, targetY, radius = 25, label = "PORTAL_A") {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.radius = radius;
        this.label = label;
        this.cooldown = 0;

        const { Bodies } = Matter;
        this.body = Bodies.circle(x, y, radius, {
            isStatic: true,
            isSensor: true, // sensor lets the ball slide through it physically
            label: "portal"
        });

        physics.addBody(this.body, this);
    }

    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Cool rotating cyber portal graphics
        const now = Date.now() * 0.003;
        ctx.strokeStyle = "#39ff14"; // green network neon
        ctx.shadowColor = "#39ff14";
        ctx.shadowBlur = 15;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing spin nodes
        ctx.rotate(now);
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.moveTo(this.radius * 0.4, 0);
            ctx.lineTo(this.radius * 0.8, 0);
        }
        ctx.stroke();

        ctx.restore();
    }

    collision(other) {
        if (this.cooldown <= 0 && other && other.body && other.body.label === "ball") {
            this.cooldown = 1000; // 1-sec cooldown to avoid instant infinite loop bounce
            audio.playSFX("charge");

            // Teleport ball body positions instantly
            Matter.Body.setPosition(other.body, { x: this.targetX, y: this.targetY });

            // Retain/slightly speed up teleportation velocity
            const speed = Matter.Vector.magnitude(other.body.velocity);
            const norm = Matter.Vector.normalise(other.body.velocity);
            Matter.Body.setVelocity(other.body, Matter.Vector.mult(norm, Math.max(speed, 6)));
        }
    }

    destroy() {
        physics.removeBody(this.body);
    }
}

// 5. BOSS ENTITY
export class Boss {
    constructor(x, y, hp = 1000, name = "FIREWALL") {
        this.x = x;
        this.y = y;
        this.hp = hp;
        this.maxHp = hp;
        this.name = name;
        this.active = true;
        this.size = 70;
        this.bobOffset = 0;

        const { Bodies } = Matter;
        this.body = Bodies.rectangle(x, y, this.size * 2, this.size * 0.8, {
            isStatic: true,
            label: "boss"
        });

        physics.addBody(this.body, this);
    }

    update(deltaTime) {
        this.bobOffset += deltaTime * 0.003;
        // Float the boss up and down slightly
        const targetY = this.y + Math.sin(this.bobOffset) * 15;
        Matter.Body.setPosition(this.body, { x: this.x, y: targetY });
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        const pos = this.body.position;
        ctx.save();
        ctx.translate(pos.x, pos.y);

        // Core mainframe look (TRON Boss style)
        ctx.strokeStyle = "#ff007f"; // Red/magenta firewall style
        ctx.lineWidth = 4;
        ctx.fillStyle = "#0c0205";
        ctx.shadowColor = "#ff007f";
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.rect(-this.size, -this.size * 0.4, this.size * 2, this.size * 0.8);
        ctx.fill();
        ctx.stroke();

        // Inner core details
        const pulse = Math.abs(Math.sin(this.bobOffset * 2)) * 12;
        ctx.fillStyle = "#ff007f";
        ctx.shadowBlur = pulse + 10;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Cyber grids on boss body
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -this.size + 15; i < this.size; i += 20) {
            ctx.moveTo(i, -this.size * 0.3);
            ctx.lineTo(i, this.size * 0.3);
        }
        ctx.stroke();

        ctx.restore();
    }

    collision(other) {
        if (other && other.body && other.body.label === "ball") {
            audio.playSFX("glitch");

            // Deduct HP proportional to ball velocity speed
            const speed = Matter.Vector.magnitude(other.body.velocity);
            const damage = Math.round(speed * 18 + 50);
            this.hp = Math.max(0, this.hp - damage);

            // Reflect ball strongly
            const forceDir = Matter.Vector.normalise(Matter.Vector.sub(other.body.position, this.body.position));
            Matter.Body.setVelocity(other.body, Matter.Vector.mult(forceDir, 14));
        }
    }

    destroy() {
        physics.removeBody(this.body);
    }
}
