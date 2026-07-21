/**
 * PIN://CORE Game Engine System & main entry point
 * Complete execution loops, state bindings, menus mapping, audio bindings and physics ticks.
 */

import { StorageManager } from './storage/storage.js';
import { audio } from './audio/audio.js';
import { physics } from './physics/physics.js';
import { levels } from './levels/levels.js';
import { Ball, Flipper, Bumper, Portal, Boss, Particle } from './entities/entities.js';

class GameEngine {
    constructor() {
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");

        this.gameState = "menu"; // menu, playing, paused, gameover, victory, replaying
        this.currentSectorId = 1;
        this.score = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.energy = 0;
        this.ballsLeft = 3;
        this.gameTime = 0; // in seconds

        this.balls = [];
        this.flippers = [];
        this.bumpers = [];
        this.portals = [];
        this.boss = null;
        this.particles = [];

        // Active Random Event status
        this.activeEvent = null;
        this.activeEventTimer = 0;

        // Custom equipped skills
        this.skills = [
            { id: "emp", name: "EMP BURST", ready: true, key: "Q" },
            { id: "slow", name: "SLOW MOTION", ready: true, key: "E" }
        ];

        // Seeds system
        this.seed = this.generateRandomSeed();

        // 30-sec input recorder for Replays
        this.recordedInputs = [];
        this.isReplaying = false;
        this.replayInputs = [];
        this.replayStepIndex = 0;

        // FPS counter tracking
        this.lastFrameTime = 0;
        this.fps = 0;

        this.initUI();
        this.bindInput();
        this.initLoop();
    }

    generateRandomSeed() {
        const hex = "0123456789ABCDEF";
        let res = "#";
        for (let i = 0; i < 8; i++) {
            res += hex[Math.floor(Math.random() * 16)];
        }
        return res;
    }

    initUI() {
        // Build settings, achievements, stats, rankings lists directly dynamically on boot
        this.refreshStatsScreen();
        this.refreshAchievementsScreen();
        this.refreshRankingsScreen();

        const save = StorageManager.getSave();
        if (save && save.profile.level > 1) {
            const btnCont = document.getElementById("btn-continue");
            btnCont.classList.remove("disabled");
            document.getElementById("continue-sector").textContent = String(save.profile.level).padStart(2, "0");
        }

        // Apply settings on launch
        const settings = StorageManager.getSettings();
        document.body.className = settings.crt ? "crt-enabled" : "";
        audio.setSFXEnabled(settings.sound);
        audio.setMusicEnabled(settings.music);

        document.getElementById("toggle-sound").textContent = settings.sound ? "ON" : "OFF";
        document.getElementById("toggle-sound").className = settings.sound ? "toggle-btn active" : "toggle-btn";

        document.getElementById("toggle-music").textContent = settings.music ? "ON" : "OFF";
        document.getElementById("toggle-music").className = settings.music ? "toggle-btn active" : "toggle-btn";

        document.getElementById("toggle-particles").textContent = settings.particles ? "ON" : "OFF";
        document.getElementById("toggle-particles").className = settings.particles ? "toggle-btn active" : "toggle-btn";

        document.getElementById("toggle-glow").textContent = settings.glow ? "ON" : "OFF";
        document.getElementById("toggle-glow").className = settings.glow ? "toggle-btn active" : "toggle-btn";

        document.getElementById("toggle-crt").textContent = settings.crt ? "ON" : "OFF";
        document.getElementById("toggle-crt").className = settings.crt ? "toggle-btn active" : "toggle-btn";

        document.getElementById("toggle-fps").textContent = settings.fps ? "ON" : "OFF";
        document.getElementById("toggle-fps").className = settings.fps ? "toggle-btn active" : "toggle-btn";
        if (settings.fps) {
            document.getElementById("fps-display").classList.remove("hidden");
        } else {
            document.getElementById("fps-display").classList.add("hidden");
        }

        document.getElementById("btn-language").textContent = settings.language === "pt-BR" ? "PT-BR" : "EN-US";
    }

    refreshStatsScreen() {
        const stats = StorageManager.getStatistics();
        const container = document.getElementById("statistics-list");
        container.innerHTML = "";

        const fields = [
            { key: "scoreTotal", label: "PONTUAÇÃO TOTAL ACUMULADA" },
            { key: "timePlayed", label: "TEMPO TOTAL JOGADO (S)" },
            { key: "ballsLost", label: "BOLAS DELETADAS / PERDIDAS" },
            { key: "bumpersHit", label: "BUMPERS ATINGIDOS" },
            { key: "comboMax", label: "COMBO MÁXIMO" },
            { key: "teleports", label: "TELEPORTES EXECUTADOS" },
            { key: "lasersActivated", label: "LASERS DO PERÍMETRO ATIVOS" },
            { key: "bossesDefeated", label: "MAIN CORES DELETADOS" },
            { key: "multiballs", label: "MULTIBALLS ALCANÇADOS" }
        ];

        fields.forEach(f => {
            const row = document.createElement("div");
            row.className = "stat-item";
            row.innerHTML = `<span class="stat-label">${f.label}</span><span class="stat-value">${stats[f.key] || 0}</span>`;
            container.appendChild(row);
        });
    }

    refreshAchievementsScreen() {
        const achievements = StorageManager.getAchievements();
        const container = document.getElementById("achievements-list");
        container.innerHTML = "";

        let unlockedCount = 0;
        achievements.forEach(a => {
            if (a.unlocked) unlockedCount++;
            const card = document.createElement("div");
            card.className = `achievement-card ${a.unlocked ? "unlocked" : ""}`;
            card.innerHTML = `
                <div class="ach-info">
                    <span class="ach-title">${a.title}</span>
                    <span class="ach-desc">${a.description}</span>
                </div>
                <span class="ach-status">${a.unlocked ? "DECODED" : "LOCKED"}</span>
            `;
            container.appendChild(card);
        });
        document.getElementById("achievements-unlocked-count").textContent = unlockedCount;
    }

    refreshRankingsScreen() {
        const ranking = StorageManager.getRanking();
        const container = document.getElementById("ranking-list");
        container.innerHTML = "";

        if (ranking.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 20px; color: #666;">NO CORES RESTORED YET</div>`;
            return;
        }

        ranking.forEach((r, idx) => {
            const row = document.createElement("div");
            row.className = "ranking-row";
            row.innerHTML = `
                <span>${idx + 1}</span>
                <span>${r.name}</span>
                <span style="color: #00f0ff; font-weight: bold;">${String(r.score).padStart(8, '0')}</span>
                <span style="color: #ff007f;">${r.seed}</span>
                <span>${r.time}s</span>
            `;
            container.appendChild(row);
        });
    }

    bindInput() {
        // Global document event bindings for screen layouts
        document.getElementById("btn-new-game").addEventListener("click", () => {
            audio.playSFX("click");
            this.startNewCampaign();
        });

        document.getElementById("btn-continue").addEventListener("click", () => {
            if (document.getElementById("btn-continue").classList.contains("disabled")) return;
            audio.playSFX("click");
            const profile = StorageManager.getProfile();
            this.startCampaignSector(profile.level);
        });

        document.getElementById("btn-achievements").addEventListener("click", () => {
            audio.playSFX("click");
            this.showScreen("achievements-menu");
        });

        document.getElementById("btn-statistics").addEventListener("click", () => {
            audio.playSFX("click");
            this.showScreen("statistics-menu");
        });

        document.getElementById("btn-settings").addEventListener("click", () => {
            audio.playSFX("click");
            this.showScreen("settings-menu");
        });

        document.getElementById("btn-rankings").addEventListener("click", () => {
            audio.playSFX("click");
            this.showScreen("rankings-menu");
        });

        // Settings toggle buttons
        document.getElementById("toggle-sound").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().sound;
            StorageManager.updateSettings({ sound: !current });
            this.initUI();
        });

        document.getElementById("toggle-music").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().music;
            StorageManager.updateSettings({ music: !current });
            this.initUI();
        });

        document.getElementById("toggle-particles").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().particles;
            StorageManager.updateSettings({ particles: !current });
            this.initUI();
        });

        document.getElementById("toggle-glow").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().glow;
            StorageManager.updateSettings({ glow: !current });
            this.initUI();
        });

        document.getElementById("toggle-crt").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().crt;
            StorageManager.updateSettings({ crt: !current });
            this.initUI();
        });

        document.getElementById("toggle-fps").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().fps;
            StorageManager.updateSettings({ fps: !current });
            this.initUI();
        });

        document.getElementById("btn-language").addEventListener("click", () => {
            audio.playSFX("click");
            const current = StorageManager.getSettings().language;
            const nextLang = current === "pt-BR" ? "en-US" : "pt-BR";
            StorageManager.updateSettings({ language: nextLang });
            this.initUI();
        });

        // Return buttons
        const backButtons = ["btn-settings-back", "btn-achievements-back", "btn-statistics-back", "btn-rankings-back", "btn-victory-back"];
        backButtons.forEach(id => {
            document.getElementById(id).addEventListener("click", () => {
                audio.playSFX("click");
                this.showScreen("start-menu");
            });
        });

        // Game Pause screen overlays options
        document.getElementById("btn-resume").addEventListener("click", () => {
            audio.playSFX("click");
            this.resumeGame();
        });

        document.getElementById("btn-abort").addEventListener("click", () => {
            audio.playSFX("click");
            this.abortGame();
        });

        // Replay features buttons
        document.getElementById("btn-save-replay").addEventListener("click", () => {
            audio.playSFX("charge");
            StorageManager.addReplay(this.recordedInputs, this.seed);
            alert("REPLAY DE 30 SEGUNDOS SALVO COM SUCESSO!");
        });

        document.getElementById("btn-play-replay").addEventListener("click", () => {
            audio.playSFX("charge");
            this.triggerReplayPlayback();
        });

        // Key listeners for flippers triggers & custom skills keys Q / E
        window.addEventListener("keydown", (e) => {
            if (this.gameState !== "playing") {
                if (e.key === "Escape" && this.gameState === "playing") {
                    this.pauseGame();
                }
                return;
            }

            const k = e.key.toLowerCase();
            const timestamp = this.gameTime * 1000;

            if (k === "arrowleft" || k === "a") {
                this.recordedInputs.push({ key: "left", type: "down", time: timestamp });
                this.setLeftFlippers(true);
            }
            if (k === "arrowright" || k === "d") {
                this.recordedInputs.push({ key: "right", type: "down", time: timestamp });
                this.setRightFlippers(true);
            }
            if (k === "space" || e.code === "Space") {
                // Ball launch plunger
                this.recordedInputs.push({ key: "space", type: "down", time: timestamp });
                this.launchPlungerBall();
            }

            // Skills activation checks
            if (k === "q") {
                this.activateSkill(0);
            }
            if (k === "e") {
                this.activateSkill(1);
            }

            if (e.key === "Escape") {
                this.pauseGame();
            }
        });

        window.addEventListener("keyup", (e) => {
            if (this.gameState !== "playing") return;

            const k = e.key.toLowerCase();
            const timestamp = this.gameTime * 1000;

            if (k === "arrowleft" || k === "a") {
                this.recordedInputs.push({ key: "left", type: "up", time: timestamp });
                this.setLeftFlippers(false);
            }
            if (k === "arrowright" || k === "d") {
                this.recordedInputs.push({ key: "right", type: "up", time: timestamp });
                this.setRightFlippers(false);
            }
        });

        // Screen Touch taps controls (supporting mobile or mouse mock taps)
        this.canvas.addEventListener("pointerdown", (e) => {
            if (this.gameState !== "playing") return;
            const x = e.clientX - this.canvas.getBoundingClientRect().left;
            if (x < this.canvas.width / 2) {
                this.setLeftFlippers(true);
            } else {
                this.setRightFlippers(true);
            }
        });

        this.canvas.addEventListener("pointerup", () => {
            if (this.gameState !== "playing") return;
            this.setLeftFlippers(false);
            this.setRightFlippers(false);
        });
    }

    showScreen(screenId) {
        // Toggle screen views
        const screens = ["start-menu", "settings-menu", "achievements-menu", "statistics-menu", "rankings-menu", "gameplay-container", "victory-screen"];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (id === screenId) {
                el.classList.remove("hidden");
                el.classList.add("active");
            } else {
                el.classList.add("hidden");
                el.classList.remove("active");
            }
        });

        if (screenId === "start-menu") {
            const save = StorageManager.getSave();
            if (save && save.profile.level > 1) {
                const btnCont = document.getElementById("btn-continue");
                btnCont.classList.remove("disabled");
                document.getElementById("continue-sector").textContent = String(save.profile.level).padStart(2, "0");
            }
        }
    }

    startNewCampaign() {
        this.seed = this.generateRandomSeed();
        this.startCampaignSector(1);
    }

    startCampaignSector(sectorId) {
        this.currentSectorId = sectorId;
        this.score = 0;
        this.combo = 1;
        this.energy = 0;
        this.gameTime = 0;
        this.recordedInputs = [];

        physics.clearWorld();
        this.balls = [];
        this.flippers = [];
        this.bumpers = [];
        this.portals = [];
        this.particles = [];
        this.boss = null;

        const data = levels.getSector(sectorId);
        this.ballsLeft = data.ballCount || 3;

        // Create basic world bounds
        this.drainBody = physics.createBorders(800, 840);

        // Installs flippers
        const flipperType = StorageManager.getProfile().selectedFlipper || "normal";
        this.flippers.push(new Flipper(260, 750, 110, 20, true, flipperType));
        this.flippers.push(new Flipper(540, 750, 110, 20, false, flipperType));

        // Plunger launcher guides
        const launcherWall = Matter.Bodies.rectangle(740, 500, 10, 600, { isStatic: true });
        physics.addBody(launcherWall, null);

        // Load level bumpers mapping
        data.bumpers.forEach(b => {
            this.bumpers.push(new Bumper(b.x, b.y, b.radius, b.type, b.params || {}));
        });

        // Load portals
        if (data.portals) {
            data.portals.forEach(p => {
                this.portals.push(new Portal(p.x, p.y, p.targetX, p.targetY, 25, p.label));
            });
        }

        // Install Sector Bosses
        if (data.boss) {
            this.boss = new Boss(data.boss.x, data.boss.y, data.boss.hp, data.boss.name);
            document.getElementById("boss-overlay").classList.remove("hidden");
            document.getElementById("boss-name-overlay").textContent = data.boss.name;
            document.getElementById("boss-hp-fill").style.width = "100%";
        } else {
            document.getElementById("boss-overlay").classList.add("hidden");
        }

        // Setup Level Objectives
        this.currentObjectives = JSON.parse(JSON.stringify(data.objectives));
        this.renderObjectivesUI();

        // Unlock first launch achievements
        StorageManager.unlockAchievement("first_launch");
        StorageManager.incrementStat("totalLaunches");

        this.spawnNewBall();

        this.gameState = "playing";
        this.showScreen("gameplay-container");
        document.getElementById("level-val").textContent = `SETOR ${String(sectorId).padStart(2, "0")}: ${data.name}`;
        document.getElementById("current-seed-val").textContent = this.seed;

        audio.startMusic();
    }

    spawnNewBall() {
        const selectedBallType = StorageManager.getProfile().selectedBall || "normal";
        const selectedSkin = StorageManager.getProfile().selectedSkin || "default";

        // Spawn ball directly in launching plunger channel (x: 765, y: 780)
        const ball = new Ball(765, 760, 12, selectedBallType, selectedSkin);
        this.balls.push(ball);

        // Keep HUD count matched
        document.getElementById("balls-val").textContent = this.ballsLeft;
    }

    launchPlungerBall() {
        // Apply immediate massive high upward impulse if ball sits inside channel
        this.balls.forEach(ball => {
            if (ball.body.position.x > 745 && ball.body.position.y > 700) {
                audio.playSFX("charge");
                Matter.Body.setVelocity(ball.body, { x: 0, y: -24 });
            }
        });
    }

    setLeftFlippers(active) {
        this.flippers.forEach(f => {
            if (f.isLeft) f.setActive(active);
        });
    }

    setRightFlippers(active) {
        this.flippers.forEach(f => {
            if (!f.isLeft) f.setActive(active);
        });
    }

    activateSkill(slotIndex) {
        if (slotIndex >= this.skills.length) return;
        const skill = this.skills[slotIndex];
        if (!skill.ready || this.energy < 50) {
            audio.playSFX("glitch");
            return;
        }

        skill.ready = false;
        this.energy = Math.max(0, this.energy - 50);
        audio.playSFX("laser");

        // Flash visual event notifier
        this.triggerEventMessage(`SKILL ACTIVE: ${skill.name}`);

        if (skill.id === "emp") {
            // Instantly damages boss and triggers screen shake
            if (this.boss) {
                this.boss.hp = Math.max(0, this.boss.hp - 350);
                this.checkBossHp();
            }
        } else if (skill.id === "slow") {
            // Trigger 4-sec global temporal slow motion
            this.activeEvent = "SLOW_MOTION";
            this.activeEventTimer = 4000;
        }

        // Restore ready state after 10-sec cooldown
        setTimeout(() => {
            skill.ready = true;
        }, 10000);
    }

    triggerEventMessage(msg) {
        const el = document.getElementById("event-announcer");
        document.getElementById("event-text").textContent = msg;
        el.classList.remove("hidden");
        setTimeout(() => {
            el.classList.add("hidden");
        }, 3000);
    }

    renderObjectivesUI() {
        const list = document.getElementById("objectives-list");
        list.innerHTML = "";
        this.currentObjectives.forEach(obj => {
            const item = document.createElement("div");
            item.className = `objective-item ${obj.completed ? "completed" : ""}`;
            item.innerHTML = `
                <div class="objective-box">${obj.completed ? "✓" : ""}</div>
                <span>${obj.text} (${obj.progress}/${obj.target})</span>
            `;
            list.appendChild(item);
        });
    }

    updateObjectiveProgress(id, amount) {
        const obj = this.currentObjectives.find(o => o.id === id);
        if (obj && !obj.completed) {
            obj.progress = Math.min(obj.target, obj.progress + amount);
            if (obj.progress >= obj.target) {
                obj.completed = true;
                audio.playSFX("laser");
                this.score += 5000;
            }
            this.renderObjectivesUI();
            this.checkLevelCompletion();
        }
    }

    checkBossHp() {
        if (!this.boss) return;

        const pct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
        document.getElementById("boss-hp-fill").style.width = `${pct}%`;

        if (this.boss.hp <= 0) {
            audio.playSFX("glitch");
            this.boss.destroy();
            this.boss = null;
            document.getElementById("boss-overlay").classList.add("hidden");

            // Track stats
            StorageManager.incrementStat("bossesDefeated");
            StorageManager.updateMissionProgress("defeat_boss", 1);

            // Level goals completed check
            this.triggerEventMessage("FIREWALL DESTROYED");
            this.score += 50000;
            this.checkLevelCompletion();
        }
    }

    checkLevelCompletion() {
        // Complete when boss is deleted and objectives are met
        const allDone = this.currentObjectives.every(o => o.completed);
        const bossDone = !this.boss;

        if (allDone && bossDone) {
            this.completeSector();
        }
    }

    completeSector() {
        this.gameState = "menu";
        audio.stopMusic();

        // Increment saved level profiles
        const nextSec = this.currentSectorId + 1;
        StorageManager.updateProfile({ level: nextSec });
        StorageManager.addRanking("OPERATOR_" + this.seed.substring(1, 5), this.score, this.seed, Math.round(this.gameTime));

        if (nextSec > 6) {
            // Victory system completely restored sequence
            this.showScreen("victory-screen");
        } else {
            // Start next phase campaign
            this.startCampaignSector(nextSec);
        }
    }

    pauseGame() {
        this.gameState = "paused";
        document.getElementById("pause-overlay").classList.remove("hidden");
    }

    resumeGame() {
        this.gameState = "playing";
        document.getElementById("pause-overlay").classList.add("hidden");
    }

    abortGame() {
        this.gameState = "menu";
        audio.stopMusic();
        document.getElementById("pause-overlay").classList.add("hidden");
        this.showScreen("start-menu");
    }

    triggerReplayPlayback() {
        if (this.recordedInputs.length === 0) return;
        this.replayInputs = [...this.recordedInputs];
        this.isReplaying = true;
        this.replayStepIndex = 0;
        this.gameState = "playing";
        document.getElementById("replay-indicator").classList.remove("hidden");

        // Reload world state for replaying simulations
        this.startCampaignSector(this.currentSectorId);
    }

    stopReplayPlayback() {
        this.isReplaying = false;
        document.getElementById("replay-indicator").classList.add("hidden");
    }

    // Main Engine Update tick and render cycle
    initLoop() {
        const loop = (timestamp) => {
            const dt = timestamp - this.lastFrameTime;
            this.lastFrameTime = timestamp;
            this.fps = Math.round(1000 / dt);

            this.update(dt);
            this.draw();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame((ts) => {
            this.lastFrameTime = ts;
            requestAnimationFrame(loop);
        });
    }

    update(deltaTime) {
        if (this.gameState !== "playing") return;

        // Handle replaying inputs simulations
        if (this.isReplaying && this.replayStepIndex < this.replayInputs.length) {
            const currentMs = this.gameTime * 1000;
            while (this.replayStepIndex < this.replayInputs.length && this.replayInputs[this.replayStepIndex].time <= currentMs) {
                const inp = this.replayInputs[this.replayStepIndex];
                if (inp.key === "left") {
                    this.setLeftFlippers(inp.type === "down");
                } else if (inp.key === "right") {
                    this.setRightFlippers(inp.type === "down");
                } else if (inp.key === "space" && inp.type === "down") {
                    this.launchPlungerBall();
                }
                this.replayStepIndex++;
            }
            if (this.replayStepIndex >= this.replayInputs.length) {
                this.stopReplayPlayback();
            }
        }

        // Ticks clocks
        this.gameTime += deltaTime / 1000;
        if (Math.random() < 0.003) {
            // Update total time played stats
            StorageManager.incrementStat("timePlayed", 1);
        }

        // Dilated temporal modifier
        let timeModifier = 1.0;
        if (this.activeEvent === "SLOW_MOTION") {
            timeModifier = 0.4;
            this.activeEventTimer -= deltaTime;
            if (this.activeEventTimer <= 0) {
                this.activeEvent = null;
            }
        }

        // Physics step
        physics.update(deltaTime * timeModifier);

        // Update flippers
        this.flippers.forEach(f => f.update(deltaTime));

        // Update active bumpers
        for (let i = this.bumpers.length - 1; i >= 0; i--) {
            const b = this.bumpers[i];
            b.update(deltaTime);
            if (b.type === "shield" && b.health !== null && b.health <= 0) {
                this.bumpers.splice(i, 1);
                this.updateObjectiveProgress("break_shields", 1);
            }
        }

        // Update portals
        this.portals.forEach(p => p.update(deltaTime));

        // Update Boss
        if (this.boss) {
            this.boss.update(deltaTime);
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Handle Balls positioning & interactions
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            ball.update(deltaTime, this.particles);

            const pos = ball.body.position;

            // Handle portals teleports
            this.portals.forEach(p => {
                const dist = Matter.Vector.magnitude(Matter.Vector.sub(pos, { x: p.x, y: p.y }));
                if (dist < p.radius + ball.radius) {
                    p.collision(ball);
                    this.updateObjectiveProgress("use_portal", 1);
                    StorageManager.incrementStat("teleports", 1);
                }
            });

            // Handle bottom drain ball loss
            if (pos.y > 830) {
                ball.destroy();
                this.balls.splice(i, 1);
                audio.playSFX("glitch");

                StorageManager.incrementStat("ballsLost", 1);

                if (this.balls.length === 0) {
                    this.ballsLeft--;
                    if (this.ballsLeft > 0) {
                        this.spawnNewBall();
                    } else {
                        // Game Over sequence
                        this.triggerEventMessage("SYSTEM OFFLINE");
                        setTimeout(() => {
                            this.abortGame();
                        }, 2000);
                    }
                }
            }
        }

        // Trigger dynamic seed-based random events during play
        if (Math.random() < 0.0004 && !this.activeEvent) {
            const events = ["POWER_SURGE", "DOUBLE_SCORE", "OVERCLOCK"];
            const choice = events[Math.floor(Math.random() * events.length)];
            this.activeEvent = choice;
            this.activeEventTimer = 5000; // 5 seconds
            this.triggerEventMessage(choice.replace("_", " "));
            audio.playSFX("charge");
        }

        if (this.activeEvent && this.activeEvent !== "SLOW_MOTION") {
            this.activeEventTimer -= deltaTime;
            if (this.activeEventTimer <= 0) {
                this.activeEvent = null;
            }
        }

        // Check bumpers collision scores
        this.bumpers.forEach(b => {
            this.balls.forEach(ball => {
                const dist = Matter.Vector.magnitude(Matter.Vector.sub(ball.body.position, { x: b.x, y: b.y }));
                if (dist < b.radius + ball.radius + 2) {
                    // Score counting
                    let pts = b.hitScore * this.combo;
                    if (this.activeEvent === "DOUBLE_SCORE") pts *= 2;
                    this.score += pts;

                    // Increment combos
                    this.comboTimer = 2500; // 2.5 seconds combo reset window
                    this.combo = Math.min(20, this.combo + 1);

                    // Add energy on successful scoring
                    this.energy = Math.min(100, this.energy + 3);

                    StorageManager.incrementStat("bumpersHit", 1);
                    StorageManager.updateMissionProgress("bumpers_500", 1);

                    // Type specific bumper objectives increment
                    if (b.type === "normal") {
                        this.updateObjectiveProgress("nodes_3", 1);
                    } else if (b.type === "explosive") {
                        this.updateObjectiveProgress("bumpers_hit", 1);
                    } else if (b.type === "temporal") {
                        this.updateObjectiveProgress("temporal_hit", 1);
                    } else if (b.type === "magnetic") {
                        this.updateObjectiveProgress("core_all", 1);
                    }

                    if (this.score >= 10000) this.updateObjectiveProgress("score_10k", 10000);
                    if (this.score >= 50000) this.updateObjectiveProgress("score_50k", 50000);
                    if (this.score >= 100000) this.updateObjectiveProgress("score_100k", 100000);
                    if (this.score >= 250000) this.updateObjectiveProgress("score_250k", 250000);
                    if (this.score >= 500000) this.updateObjectiveProgress("score_500k", 500000);
                    if (this.score >= 1000000) this.updateObjectiveProgress("score_1m", 1000000);
                }
            });
        });

        // Decay Combo multipliers
        if (this.comboTimer > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 1;
            }
        }

        // Check Boss damage hits
        if (this.boss) {
            this.balls.forEach(ball => {
                const dist = Matter.Vector.magnitude(Matter.Vector.sub(ball.body.position, this.boss.body.position));
                if (dist < this.boss.size + ball.radius) {
                    this.boss.collision(ball);
                    this.checkBossHp();
                }
            });
        }

        // Refresh HUD elements
        document.getElementById("score-val").textContent = String(this.score).padStart(8, "0");
        document.getElementById("combo-val").textContent = `x${this.combo}`;
        document.getElementById("energy-fill").style.width = `${this.energy}%`;
        document.getElementById("energy-val").textContent = `${this.energy}%`;

        document.getElementById("fps-display").textContent = `FPS: ${this.fps}`;
    }

    draw() {
        if (this.gameState !== "playing" && this.gameState !== "paused") return;

        // Clear layout canvas
        this.ctx.fillStyle = "#050505";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid aesthetics backdrop lines
        this.ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw bumpers
        this.bumpers.forEach(b => b.draw(this.ctx));

        // Draw portals
        this.portals.forEach(p => p.draw(this.ctx));

        // Draw Boss
        if (this.boss) {
            this.boss.draw(this.ctx);
        }

        // Draw flippers
        this.flippers.forEach(f => f.draw(this.ctx));

        // Draw balls
        this.balls.forEach(b => b.draw(this.ctx));

        // Draw particles
        this.particles.forEach(p => p.draw(this.ctx));
    }
}

// Instantiate core on DOM loaded
window.addEventListener("DOMContentLoaded", () => {
    window.game = new GameEngine();
});
