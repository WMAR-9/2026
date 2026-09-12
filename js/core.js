import { playSound } from "./audio";
import { AB, boxesTouch, CB, cos, HIT, hypot, M, max, min, N, normDeg, PI, rand, randInt, resetXY, sin } from "./basic";
import { CHARACTER_PALETTES, drawDiamondProjectile, isBodyActiveInDimension, isGateActiveInDimension } from "./drawSprite";

export let
    isUpside = 0,
    globalTime = 8,
    gameState = {
        camera: resetXY(0, 0),
        currentLevelIndex: 0,
        levelData: null,
        queueIndex: 0,
        activeButtons: new Set(),

        entities: [],
        bodies: [],
        gates: [],
        spikes: [],
        bloodParticles: [],
        laserSegments: [],
        projectiles: [],

        gameComplete: 0,
        isGameOver: 0,
        timer: globalTime,
        keys: {},
        player: { x: 60, y: 340, w: 26, h: 32, vx: 0, vy: 0, isGrounded: 0, facing: 1, isRamming: 0, ramTimer: 0, charType: 0 }
    },

    toggleUpside = () => {
        !gameState.isGameOver && (
            (isUpside ^= 1) && (gameState.timer = globalTime),
            playSound(3)
        );
    },
    InitUpside = () => isUpside = 0,

    createPlayer = (x, y, charType = 0) => ({
        startX: x, startY: y, x, y,
        w: 26, h: 32, vx: 0, vy: 0,
        isGrounded: 0, facing: 1,
        isRamming: 0, ramTimer: 0,
        charType
    }),

    resetPlayer = (p, x, y, c) => (
        p.x = x,
        p.y = y,
        p.w = 26, p.h = 32,
        p.vx = p.vy = p.ramTimer = p.isGrounded = p.isRamming = 0,
        c !== undefined && (p.charType = c),
        isUpside = 0
        
    ),

    getCurrentCharacter = (q = gameState.levelData?.characterQueue) => q ? q[gameState.queueIndex % q.length] : 0,

    advanceToNextCharacter = (d = gameState.levelData) =>
        ++gameState.queueIndex >= d.characterQueue.length
            ? (gameState.isGameOver = 1, playSound(1))
            : resetPlayer(gameState.player, d.spawn.x ?? d.spawn[0], d.spawn.y ?? d.spawn[1], getCurrentCharacter()),

    // 雙界活性判定：表世界魂體(0)在表世界不阻擋；裏世界屍體(1)在表世界為雲朵踏板
    // isBodyActiveInDimension = (b, isUp = isUpside) => Boolean(isUp || b.originDimension === 1),

    createSacrificeBody = (x, isPinned = 0, facing, dim = isUpside, g = gameState, p = g.player) => (
        g.bodies.push({
            x: x ?? p.x,
            y: p.y,
            w: 32,
            h: isPinned ? 22 : 10,
            isPinned,
            facing: facing ?? (p.facing < 0 ? -1 : 1),
            originDimension: dim,
            charType: p.charType,
            vy: 0,
            grounded: isPinned
        }),
        advanceToNextCharacter()
    ),

    // 碎片系統：純數字號碼記錄 (0~6)
    spawnFractureParticles = (x, y, colorId = 0) => {
        for (let i = 12; i--;)
            gameState.bloodParticles.push({
                x, y,
                vx: rand(8) - 4,
                vy: rand(8) - 5,
                size: rand(4) + 2,
                color: typeof colorId === 'number' ? colorId : 0,
                life: rand(15) + 20 | 0
            });
    },

    executeWallPinSacrifice = (s, g = gameState, p = g.player, isL = p.x < s.x, isR = p.x > s.x + s.w) =>
        !g.isGameOver && (
            playSound(2),
            createSacrificeBody(
                isL ? s.x - 11 : isR ? s.x + s.w + 11 : s.x + (p.x < s.x + s.w / 2 ? -13 : s.w + 13),
                1,
                isL ? -1 : isR ? 1 : p.facing,
                1
            ),
            isUpside = 0
        ),

    executeTimeSacrifice = (g = gameState) =>
        !g.isGameOver && (
            spawnFractureParticles(g.player.x, g.player.y, g.player.charType),
            playSound(1),
            createSacrificeBody(null, 0, null, 1),
            isUpside = 0
        ),

    // 表世界自我犧牲：產生魂體 (dim = 0)
    executePastelSacrifice = (g = gameState) =>
        !(isUpside || g.isGameOver) && (
            playSound(1),
            spawnFractureParticles(g.player.x, g.player.y, g.player.charType),
            createSacrificeBody(null, 0, null, 0)
        ),

    undoLastSacrifice = (g = gameState, s = g.levelData?.spawn) =>
        g.bodies.pop() && (
            g.queueIndex && g.queueIndex--,
            g.isGameOver = 0,
            resetPlayer(g.player, s.x ?? s[0], s.y ?? s[1], getCurrentCharacter()),
            playSound(3)
        ),

    updatePinnedBodiesState = (bodies, platforms, spikes = []) => {
        let pinned = bodies.filter(b => b.isPinned);
        if (!pinned.length) return;

        let surfaces = [...platforms, ...spikes],
            queue = pinned.filter(b => surfaces.some(s => boxesTouch(CB(b), s, 4)));

        for (let i = 0; i < queue.length; i++) {
            for (let other of pinned) {
                !queue.includes(other) && boxesTouch(CB(queue[i]), CB(other), 4) && queue.push(other);
            }
        }

        pinned.forEach(b => queue.includes(b) || (b.isPinned = b.grounded = 0, b.h = 10));
    },

    updateBody = (body, platforms, entities, bodies, isUpsideDown = isUpside) => {
        if (!isBodyActiveInDimension(body, isUpsideDown) || body.isPinned) return;

        let hw = body.w / 2, hh = body.h / 2,
            bBox = CB(body),
            by2 = body.y + hh,
            obs = [
                ...platforms,
                ...entities.filter(e => e.k == 2),
                ...bodies.filter(b => b != body && (b.grounded || b.isPinned) && isBodyActiveInDimension(b, isUpsideDown)).map(CB)
            ];

        body.grounded && (body.grounded = +obs.some(p => HIT(bBox, p, 3) && AB(by2 - p.y) <= 3));

        if (!body.grounded) {
            body.y += body.vy = (body.vy || 0) + 0.45;
            bBox.y = body.y - hh;
            for (let p of obs) {
                // 【修改處】：加入 by2 <= p.y + 4，刪除冗長的 Y 軸相交判斷
                if (body.vy > 0 && HIT(bBox, p, 0) && by2 <= p.y + 4) {
                    body.y = p.y - hh;
                    body.vy = 0;
                    body.grounded = 1;
                    break;
                }
            }
        }
    },

    rayBoxIntersection = (rx, ry, dx, dy, bx, by, bw, bh) => {
        let tmin = -Infinity, tmax = Infinity;
        for (let [r, d, b, dim] of [[rx, dx, bx, bw], [ry, dy, by, bh]]) {
            if (d !== 0) {
                let t1 = (b - r) / d, t2 = (b + dim - r) / d;
                tmin = max(tmin, min(t1, t2));
                tmax = min(tmax, max(t1, t2));
            } else if (r < b || r > b + dim) return -1;
        }
        return tmax >= tmin && tmax > 0 ? (tmin > 0 ? tmin : tmax) : -1;
    },

    reflectRay = (dx, dy, deg) => {
        let rad = normDeg(deg) * PI / 180,
            c = cos(rad * 2), s = sin(rad * 2),
            rx = -dx * c - dy * s,
            ry = -dx * s + dy * c,
            len = hypot(rx, ry) || 1,
            clean = v => AB(v) < 1e-4 ? 0 : v / len;
        return resetXY(clean(rx), clean(ry));
    },

    // 射線段計算：雷射攜帶主角純數字號碼 (colorId: 0~6)
    calculateLaserSegments = () => {
        let segments = [],
            mirrors = gameState.entities.filter(e => e.k == 2),
            sources = mirrors.filter(m => m.type === 1 && m.lightActive && m.lightTimer > 0);

        sources.forEach(src => {
            let currX = src.x + (src.lightDir > 0 ? src.w + 2 : -2),
                currY = src.y + src.h / 2,
                dirX = src.lightDir, dirY = 0,
                hitMirrors = new Set([src]);

            for (let bounce = 0; bounce < 10 && (dirX || dirY); bounce++) {
                let closestDist = 2000, hitObj = null,
                    targets = [
                        ...gameState.levelData.platforms,
                        ...mirrors.filter(m => !hitMirrors.has(m))
                    ];

                for (let target of targets) {
                    let d = rayBoxIntersection(currX, currY, dirX, dirY, target.x, target.y, target.w, target.h);
                    if (d > 0.1 && d < closestDist) {
                        closestDist = d;
                        hitObj = target.angle !== undefined ? target : null;
                    }
                }

                let nextX = currX + dirX * closestDist,
                    nextY = currY + dirY * closestDist;

                segments.push({
                    x1: currX, y1: currY, x2: nextX, y2: nextY,
                    color: src.lightColor,
                    colorId: src.colorId ?? 0
                });

                if (!hitObj) break;

                hitMirrors.add(hitObj);
                currX = nextX + dirX * 0.2;
                currY = nextY + dirY * 0.2;
                let ref = reflectRay(dirX, dirY, hitObj.angle);
                dirX = ref.x;
                dirY = ref.y;
            }
        });

        return segments;
    },

    lineIntersectsBox = (x1, y1, x2, y2, bx, by, bw, bh, t) =>
    (t = rayBoxIntersection(x1, y1, x2 - x1, y2 - y1, bx, by, bw, bh)) >= 0 && t <= 1,

    updateSwitchState = (sw, player, bodies, isUpsideDown = isUpside) => {
        let was = sw.isPressed,
            T = (e, pad) => HIT(CB(e), { x: sw.x, y: sw.y - pad, w: sw.w, h: sw.h + pad });

        sw.isPressed = +((sw.type == 1)
            ? gameState.laserSegments?.some(s => lineIntersectsBox(s.x1, s.y1, s.x2, s.y2, sw.x, sw.y, sw.w, sw.h))
            : (!sw.mode && T(player, 2)) || bodies.some(b =>
                (b.grounded || b.isPinned) &&
                isBodyActiveInDimension(b, isUpsideDown) &&
                (!sw.mode || b.originDimension === 0) &&
                T(b, 4)
            )
        );

        !was && sw.isPressed && playSound(3);
    };

// =========================================================================
// 1. 鏡面移動與雷射擊中怪物 (純數字命中規則，消滅任何字串比對)
// =========================================================================
export function updateMirrorPhysics(m, platforms, entities) {
    if (m.lightTimer > 0) {
        if (--m.lightTimer <= 0) m.lightActive = false;
    }

    let laserSegments = gameState.laserSegments || [],
        monsters = entities.filter(e => e.k == 3 && !e.isDefeated);

    for (let seg of laserSegments) {
        for (let i = monsters.length - 1; i >= 0; i--) {
            let mon = monsters[i];
            if (mon.type === 2 && !isUpside) continue;

            if (lineIntersectsBox(seg.x1, seg.y1, seg.x2, seg.y2, mon.x, mon.y, mon.w, mon.h)) {
                // 【核心規則】：1/2 型任意命中；3/4 型必須雷射純數字 === 怪物純數字
                let canHit = mon.type <= 2 || seg.colorId === mon.color;

                if (canHit) {
                    if (mon.type === 4) { // Boss 首領怪
                        if (mon.hitCooldown <= 0 && !mon.isDefeated) {
                            mon.hitCooldown = 60;
                            playSound(4);
                            spawnFractureParticles(mon.x + mon.w / 2, mon.y + mon.h / 2, mon.color);
                            mon.remainingColors = mon.remainingColors || [0, 1, 2, 3, 4, 5, 6];
                            mon.remainingColors.splice(mon.colorIndex || 0, 1);

                            if (mon.remainingColors.length > 0) {
                                mon.colorIndex = (mon.colorIndex || 0) % mon.remainingColors.length;
                                mon.color = mon.remainingColors[mon.colorIndex]; // 轉為下一個純數字 (0~6)
                            } else {
                                
                                mon.isDefeated = 1;
                                gameState.gameComplete = 1;
                                playSound(5)
                                gameState.bs = [mon.x + mon.w / 2, mon.y + mon.h / 2, 0];
                                for (let k = 0; k < 30; k++) spawnFractureParticles(mon.x + rand(mon.w), mon.y + rand(mon.h), mon.color);
                                let eIdx = gameState.entities.indexOf(mon);
                                if (eIdx >= 0) gameState.entities.splice(eIdx, 1);
                                break;
                            }
                        }
                    } else { // 1 型巡邏、2 型射手、3 型跳躍怪
                        playSound(2);
                        spawnFractureParticles(mon.x + mon.w / 2, mon.y + mon.h / 2, mon.color);
                        mon.isDefeated = 1;
                        let eIdx = gameState.entities.indexOf(mon);
                        if (eIdx >= 0) gameState.entities.splice(eIdx, 1);
                    }
                }
            }
        }
    }

    if (m.type === 2) {
        m.vy = (m.vy || 0) + 0.45;
        m.y += m.vy;
        let obs = [...platforms, ...entities.filter(o => o.k == 2 && o != m)];
        for (let plat of obs) {
            if (m.x < plat.x + plat.w && m.x + m.w > plat.x && m.y < plat.y + plat.h && m.y + m.h > plat.y) {
                if (m.vy > 0) { m.y = plat.y - m.h; m.vy = 0; m.grounded = 1; }
            }
        }
    } else if (m.type === 3) {
        m.y = m.railY || m.y;
        if (m.x < m.railMinX) m.x = m.railMinX;
        if (m.x + m.w > m.railMaxX) m.x = m.railMaxX - m.w;
    }
}

// =========================================================================
// 2. 怪物 AI、物理與巡邏更新 (純數字色彩管理)
// =========================================================================
export function updateMonsterPhysics(mon, platforms, gates, entities, player, bodies, isUp = isUpside) {
    if (mon.isDefeated) return;

    mon.pauseTimer = mon.pauseTimer || 0;
    mon.shootTimer = mon.shootTimer || 0;
    mon.jumpTimer = mon.jumpTimer || 0;
    mon.grounded = mon.grounded || 0;
    mon.colorTimer = mon.colorTimer || 0;
    mon.colorIndex = mon.colorIndex || 0;
    mon.color = typeof mon.color === 'number' ? mon.color : 0;

    let mirrors = entities.filter(e => e.k == 2),
        obstacles = [
            ...platforms,
            ...gates.filter(g => !g.isOpen && isGateActiveInDimension(g, isUp)),
            ...mirrors
        ];

    mon.vy = (mon.vy || 0) + 0.45;
    mon.y += mon.vy;
    mon.grounded = 0;

    for (let obs of obstacles) {
        if (mon.x + mon.w > obs.x && mon.x < obs.x + obs.w) {
            if (mon.vy > 0 && mon.y + mon.h >= obs.y && mon.y + mon.h - mon.vy <= obs.y + 8) {
                mon.y = obs.y - mon.h; mon.vy = 0; mon.grounded = 1;
            } else if (mon.vy < 0 && mon.y <= obs.y + obs.h && mon.y - mon.vy >= obs.y + obs.h - 8) {
                mon.y = obs.y + obs.h; mon.vy = 0;
            }
        }
    }

    if (mon.pauseTimer > 0) mon.pauseTimer--;
    else if (mon.type === 1 && rand(1) < 0.005) mon.pauseTimer = randInt(40) + 20;

    if (mon.type === 3 || mon.type === 4) {
        if (--mon.jumpTimer <= 0 && mon.grounded) {
            mon.vy = mon.type === 4 ? -10.2 : -8.2;
            mon.grounded = 0;
            mon.jumpTimer = mon.type === 4 ? 70 + randInt(40) : 80 + randInt(50);
            playSound(0);
            if (rand(1) < 0.65) mon.dir = player.x > mon.x ? 1 : -1;
        }
    }

    if (mon.type === 4) {
        if (mon.hitCooldown > 0) mon.hitCooldown--;
        mon.remainingColors = mon.remainingColors || [0, 1, 2, 3, 4, 5, 6];
        if (mon.remainingColors.length > 0 && ++mon.colorTimer >= 180) {
            mon.colorTimer = 0;
            mon.colorIndex = (mon.colorIndex + 1) % mon.remainingColors.length;
            mon.color = mon.remainingColors[mon.colorIndex];
        }
    }

    // =========================================================================
    // 怪物攻擊與彈幕發射整合優化版 (JS13KB 程式碼減量)
    // =========================================================================
    let isAttacking = false;
    let distToPlayer = hypot(player.x - (mon.x + mon.w / 2), player.y - (mon.y + mon.h / 2));

    // Type 2 (射手) 需在 280 範圍內；Type 4 (Boss) 則全場主動攻擊
    if ((mon.type === 2 && distToPlayer <= 280) || mon.type === 4) {
        if (mon.type === 2) {
            isAttacking = true;
            mon.dir = player.x > mon.x ? 1 : -1;
        }

        // 共用射擊冷卻計時器
        if (--mon.shootTimer <= 0) {
            let pDir = player.x > mon.x ? 1 : -1;
            let cId = mon.colorId ?? mon.color ?? 0;

            // 依據怪物種類動態配置子彈偏移量 (Type 2 發射 1 顆，Type 4 Boss 發射上下 2 顆)
            let offsets = mon.type === 4 ? [4, mon.h - 22] : [mon.h / 2 - 5];

            offsets.forEach((oy, idx) => {
                gameState.projectiles.push({
                    x: mon.x + (pDir > 0 ? mon.w + 2 : (mon.type === 4 ? -20 : -12)),
                    y: mon.y + oy,
                    w: mon.type === 4 ? 18 : 10,
                    h: mon.type === 4 ? 18 : 10,
                    vx: pDir * (mon.type === 4 ? 4.2 : 4),
                    vy: mon.type === 4 ? (idx === 0 ? -0.4 : 0.4) : 0,
                    color: cId,
                    angle: 0
                });
            });

            mon.shootTimer = (mon.type === 4 ? 100 : 130) + randInt(30);
            playSound(4);
        }
    } else if (mon.type === 2) {
        mon.shootTimer = 60;
    }

    if (mon.pauseTimer <= 0 && !isAttacking) {
        let speed = mon.type === 4 ? 1.5 : (mon.type === 3 ? 1.6 : 1.3);
        if (mon.type !== 3 || !mon.grounded) mon.x += speed * mon.dir;
    }

    if (mon.x <= mon.minX) { mon.x = mon.minX; mon.dir = 1; }
    else if (mon.x + mon.w >= mon.maxX) { mon.x = mon.maxX - mon.w; mon.dir = -1; }

    for (let obs of obstacles) {
        if (mon.x + mon.w > obs.x && mon.x < obs.x + obs.w) {
            if (mon.y + mon.h > obs.y + 4 && mon.y < obs.y + obs.h - 4) {
                mon.x = mon.dir > 0 ? obs.x - mon.w : obs.x + obs.w;
                mon.dir *= -1;
                break;
            }
        }
    }

    for (let i = bodies.length - 1; i >= 0; i--) {
        let b = bodies[i];
        if (!isBodyActiveInDimension(b, isUp)) continue;
        let bx = b.x - b.w / 2, by = b.y - b.h / 2;
        if (mon.x < bx + b.w && mon.x + mon.w > bx && mon.y < by + b.h && mon.y + mon.h > by) {
            if (!((mon.type === 2 || mon.type === 4) && !isUp)) {
                playSound(1);
                spawnFractureParticles(b.x, b.y, b.charType);
                bodies.splice(i, 1);
            }
        }
    }

    if (!((mon.type === 2 || mon.type === 4) && !isUp)) {
        if (player.x + player.w / 2 > mon.x && player.x - player.w / 2 < mon.x + mon.w &&
            player.y + player.h / 2 > mon.y && player.y - player.h / 2 < mon.y + mon.h) {
            playSound(1);
            spawnFractureParticles(player.x, player.y, player.charType);
            isUpside = 0;
            gameState.timer = 8.0;
            advanceToNextCharacter();
        }
    }
}

// =========================================================================
// 3. 彈幕推進與碰撞
// =========================================================================
export function updateProjectiles(platforms = gameState.levelData?.platforms || [], entities = gameState.entities, player = gameState.player, bodies = gameState.bodies) {
    let projs = gameState.projectiles = gameState.projectiles || [],
        mirrors = entities.filter(e => e.k == 2);

    for (let i = projs.length - 1; i >= 0; i--) {
        let p = projs[i];
        p.angle = (p.angle || 0) + 0.15;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -200 || p.x > 1200 || p.y < -200 || p.y > 800) {
            projs.splice(i, 1);
            continue;
        }

        if (platforms.some(plat => HIT(p, plat))) {
            spawnFractureParticles(p.x + p.w / 2, p.y + p.h / 2, p.color);
            playSound(1);
            projs.splice(i, 1);
            continue;
        }

        if (mirrors.some(m => HIT(p, m))) {
            spawnFractureParticles(p.x + p.w / 2, p.y + p.h / 2, 4);
            playSound(1);
            projs.splice(i, 1);
            continue;
        }

        if (HIT(p, CB(player))) {
            playSound(1);
            spawnFractureParticles(player.x, player.y, player.charType);
            projs.splice(i, 1);
            isUpside = 0;
            advanceToNextCharacter();
            continue;
        }

        let hitB = bodies.find((b, idx) => {
            if (isBodyActiveInDimension(b, isUpside) && HIT(p, CB(b))) {
                playSound(1);
                spawnFractureParticles(b.x, b.y, b.charType);
                bodies.splice(idx, 1);
                return true;
            }
        });
        if (hitB) {
            projs.splice(i, 1);
            continue;
        }
    }
}

export const drawProjectiles = () => {
    (gameState.projectiles || []).forEach(p => drawDiamondProjectile(p.x + p.w / 2, p.y + p.h / 2, p.angle || 0,p.color));
};

// =========================================================================
// 4. 玩家移動與碰撞
// =========================================================================
export function checkPlayerCollisionX(p, platforms, gates, bodies, entities, isUp = isUpside) {
    let hw = p.w / 2,
        bp = { x: p.x - hw, y: p.y - p.h / 2 + 2, w: p.w, h: p.h - 4 },
        mirs = entities?.filter ? entities.filter(e => e.k == 2) : (entities || []),
        pushX = o => (p.x = p.x < o.x + o.w / 2 ? o.x - hw : o.x + o.w + hw, p.vx = 0);

    for (let m of mirs) {
        if (HIT(bp, m)) {
            if (p.isRamming) {
                p.isRamming = 0;
                if (m.type == 1) {
                    m.lightActive = 1;
                    m.lightTimer = 400;
                    m.colorId = typeof p.charType === 'number' ? p.charType : 0;
                    m.lightColor = CHARACTER_PALETTES[m.colorId][2];
                    m.lightDir = p.facing;
                    playSound(4);
                } else {
                    m.angle = (m.angle + p.facing * 22.5 + 360) % 360;
                    playSound(3);
                }
                isUpside = 0;
                return advanceToNextCharacter();
            }

            if (m.type > 1) {
                let dx = p.vx * 0.6, tx = m.x + dx;
                if (m.type == 3) tx = Math.max(m.railMinX, Math.min(tx, m.railMaxX - m.w));
                for (let o of mirs) {
                    if (o != m && m.y < o.y + o.h && m.y + m.h > o.y) {
                        dx > 0 && m.x + m.w <= o.x + 1 && tx + m.w > o.x && (tx = Math.min(tx, o.x - m.w));
                        dx < 0 && m.x >= o.x + o.w - 1 && tx < o.x + o.w && (tx = Math.max(tx, o.x + o.w));
                    }
                }
                let mons = entities.filter(e => e.k == 3);
                let blocked = mons.some(mon =>
                    !mon.isDefeated && !((mon.type == 2 || mon.type == 4) && !isUp) &&
                    tx < mon.x + mon.w && tx + m.w > mon.x && m.y < mon.y + mon.h && m.y + m.h > mon.y
                );
                if (!blocked) m.x = tx;
            }
            pushX(m);
        }
    }

    for (let g of gates) !g.isOpen && isGateActiveInDimension(g, isUp) && HIT(bp, g) && pushX(g);

    let walls = [...platforms, ...bodies.filter(b => (b.grounded || b.isPinned) && isBodyActiveInDimension(b, isUp)).map(CB)];
    for (let w of walls) {
        if (HIT(bp, w) && bp.y + bp.h > w.y + 4) {
            if (p.isRamming && isUp) {
                p.isRamming = 0;
                return executeWallPinSacrifice(w);
            }
            pushX(w);
        }
    }

    for (let s of gameState.spikes || []) {
        if (s.theme == isUp && HIT(CB(p), s)) {
            if (isUp) {
                s.dir == 'u' ? executeTimeSacrifice() : executeWallPinSacrifice(s);
            } else {
                spawnFractureParticles(p.x, p.y, p.charType);
                playSound(1);
                advanceToNextCharacter();
            }
            break;
        }
    }
}

export function checkPlayerCollisionY(p, platforms, gates, bodies, entities, isUp = isUpside) {
    p.isGrounded = 0;

    if (p.y > 1000) {
        playSound(1);
        gameState.timer = 8;
        return advanceToNextCharacter();
    }

    let hw = p.w / 2, hh = p.h / 2,
        mirs = entities?.filter ? entities.filter(e => e.k == 2) : (entities || []),
        obs = [
            ...platforms,
            ...mirs,
            ...gates.filter(g => !g.isOpen && isGateActiveInDimension(g, isUp)),
            ...bodies.filter(b => (b.grounded || b.isPinned) && isBodyActiveInDimension(b, isUp)).map(CB)
        ];

    for (let plat of obs) {
        if (p.x + hw - 4 > plat.x && p.x - hw + 4 < plat.x + plat.w) {
            let py = plat.y, ph = plat.h;
            if (p.vy >= 0 && p.y + hh >= py && p.y - hh < py) {
                p.y = py - hh;
                p.vy = 0;
                p.isGrounded = 1;
                break;
            } else if (p.vy < 0 && p.y - hh <= py + ph && p.y + hh > py + ph && (p.y - p.vy - hh) >= (py + ph - 2)) {
                p.y = py + ph + hh;
                p.vy = 0;
            }
        }
    }
}

export const updatePlayer = (p, keys, platforms, gates, bodies, entities) => {
    let L = keys.ArrowLeft,
        R = keys.ArrowRight,
        J = keys.ArrowUp || keys.Space;

    p.vx = L ? (p.facing = -1, -4) : R ? (p.facing = 1, 4) : p.vx * 0.7;
    J && p.isGrounded && (p.vy = -9.5, p.isGrounded = 0, playSound(0));

    p.vy += 0.48;
    p.isRamming && (p.vx = p.facing * 12, --p.ramTimer <= 0 && (p.isRamming = 0));

    p.x += p.vx;
    checkPlayerCollisionX(p, platforms, gates, bodies, entities);

    p.y += p.vy;
    checkPlayerCollisionY(p, platforms, gates, bodies, entities);
};

// export { isBodyActiveInDimension };