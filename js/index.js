import { calculateLaserSegments, drawProjectiles, executeTimeSacrifice, isUpside, updateBody, updateMirrorPhysics, updateMonsterPhysics, updatePinnedBodiesState, updatePlayer, updateProjectiles, updateSwitchState } from "./core";
import { AB, CB, cos, HIT, localGet, M, N, PI, rand, range, sin } from "./basic";
import { B, canvas, CC, CT, ctx, FR, gc, K, LT, MT, setWH, T } from "./canvas";
import { gameState } from "./core";
import { CHARACTER_PALETTES, drawBitmapText3D, drawBody, drawGate, drawMirror, drawMonster, drawPixelCloud, drawPixelInsideBlood, drawPixelSpikes, drawPlayer, drawSwitch } from "./drawSprite";
import { bindEvents } from "./event";
import { LEVEL_DEFS, loadLevel } from "./map";
import { Back, UI } from "./UI";
import { playSound, switchSong } from "./audio";
import { renderStartView, startState } from "./startView";
let globalTick = 0
let updateGame=_=>{
    setWH(canvas,800,500)
    if (startState < 3) {
        return renderStartView();
        
    }
    switchSong(isUpside ? 2 : 1);
    if (gameState.isGameOver||gameState.gameComplete) {
        renderGame();
        return;
    }
    globalTick = ++globalTick % 960;

    const p = gameState.player, c = gameState.camera;
    c.x += (M(p.x - 500, N(c.x, p.x - 300)) - c.x) * 0.08;
    c.y += (M(p.y - 325, N(c.y, p.y - 175)) - c.y) * 0.08;

    if (isUpside) {
        gameState.timer -= 1 / 60;
        if (gameState.timer <= 0) executeTimeSacrifice();
    }
    for (let i = gameState.bloodParticles.length - 1; i >= 0; i--) {
        let p = gameState.bloodParticles[i];
        p.x += p.vx || 0;
        p.y += p.vy;
        p.life
            ? --p.life <= 0 && gameState.bloodParticles.splice(i, 1)
            : p.y > 1000 && (p.y = range(), p.x = range());
    }

    let { player: pp, keys, levelData: ld, bodies, spikes, gates, entities: ents } = gameState,
      plats = ld.platforms,
      ex = ld.exit;
    
    ents.forEach(e => e.k == 2 && updateMirrorPhysics(e, plats, ents));
    ents.forEach(e => e.k == 3 && updateMonsterPhysics(e, plats, gates, ents, p, bodies, isUpside));
    updateProjectiles(plats, ents, p, bodies); // 推進與碰撞彈幕
    
    gameState.laserSegments = calculateLaserSegments();

    // 4. 附著遺體連鎖檢測與下墜物理
    updatePinnedBodiesState(bodies, plats, spikes);
    bodies.forEach(b => updateBody(b, plats, ents, bodies, isUpside));

    // 5. 開關狀態計算 (k: 1) 與閘門狀態同步 (純索引 targetIdx 對齊)
    ents.forEach(e => e.k == 1 && (
        updateSwitchState(e, p, bodies, isUpside),
        gates[e.targetIdx] && (gates[e.targetIdx].isOpen = e.isPressed)
    ));

    updatePlayer(p, keys, plats, gates, bodies, ents);

    let exitGate = gates.find(g => g.isExit);
    if (!isUpside && (!exitGate || exitGate.isOpen) && HIT(CB(p), ex)) {
        playSound(5);
        loadLevel((gameState.currentLevelIndex + 1) % LEVEL_DEFS.length);
    }
    renderGame()
},
renderGame=_=>{
    Back()
    const p = gameState.player
    gameState.levelData.platforms.forEach(plat =>
        (isUpside ? drawPixelInsideBlood : drawPixelCloud)(plat.x, plat.y, plat.w, plat.h)
    );

    gameState.spikes.forEach(spike =>
        (isUpside == spike.theme) &&
        drawPixelSpikes(spike.x, spike.y, spike.w, spike.h, spike.dir, spike.theme)
    );

    // 3. 雷射光束線段 (提升 lineWidth，消滅重複的 save/restore)
    ctx.lineWidth = 4;
    (gameState.laserSegments || []).forEach(seg => {
        ctx.strokeStyle = seg.color;
        B()
        MT(seg.x1, seg.y1);
        LT(seg.x2, seg.y2);
        K()
    });

    // 在 renderGame() 內部：
    // 依據實體的 k 代碼 (0: gate, 1: switch, 2: mirror, 3: monster) 直接查表繪製
    const ENTITY_PAINTERS = [drawGate, drawSwitch, drawMirror,drawMonster];

    // 單一行遍歷所有實體 (gates 已包含在 entities 陣列中，切勿再另外 forEach gates)
    gameState.entities.forEach(e => ENTITY_PAINTERS[e.k]?.(e));

    // 遺體繪製 (維持極簡單行)
    gameState.bodies.forEach(b => drawBody(b, isUpside));
    
    //   // 彈幕投射物
    drawProjectiles()

    // 6. 關卡終點出口 (全域 FR + 3 碼 Hex)
    const ex = gameState.levelData.exit;
    !isUpside && ex && (
        FR(ex.x, ex.y, ex.w, ex.h, '#b5f'),
        drawBitmapText3D("EXIT", ex.x + ex.w / 2, ex.y - 14, 1, '#fc1', '#741', 'center', 2)
    );
    // 7. 玩家實體 (存活時繪製)
    let b = gameState.entities.find(e => e.type == 4),
    t = b || ex;

    !gameState.isGameOver && (
        drawPlayer(p, globalTick),
        t && globalTick & 128 && drawBitmapText3D(
            AB(p.y - t.y) > AB(p.x - t.x) ? p.y > t.y ? '▲' : 'V' : p.x < t.x ? '▶' : '◀',
            p.x - 4, p.y - 50, 2, "#fff8"
        )
    );
    // 8. Boss 射線 (使用解構 cos/sin，簡化線段繪製)
    if (gameState.bs) {
        let [bx, by, len] = gameState.bs;
        gameState.bs[2] += 20; // 射線半徑每幀向外擴散 20px
        ctx.lineWidth = 4;
        for (let i = 42; i--;) {
            ctx.strokeStyle = CHARACTER_PALETTES[i % 7][2]; // 7色循環取色
            B()
            MT(bx, by);
            LT(bx + cos(i * PI / 21) * len, by + sin(i * PI / 21) * len);
            K();
        }
    }

    gameState.bloodParticles.forEach(p =>
        FR(p.x, p.y, p.size, p.size, isUpside?'#e22':CHARACTER_PALETTES[p.color][2])
    );
    
    T()
    UI()
},
gameLoop=_=> {
    updateGame();
    
    requestAnimationFrame(gameLoop);
}

window.onload = _ => {
    if (!CC(0)) return;
    CT(canvas);
    let s = +localGet('l') || 0,
        m = LEVEL_DEFS?.length || 1;
    loadLevel(s < m ? s : 0);
    bindEvents();
    gameLoop();
};