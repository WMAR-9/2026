import { hideUI, isMuted} from "./audio";
import { M, N, us } from "./basic";
import { B, canvas, ctx, F, FR, K, LT, MT, S, SR, TS, V } from "./canvas";
import { gameState,isUpside } from "./core";
import { CHARACTER_PALETTES, draw3DButton,drawBitmapText3D } from "./drawSprite";


let Clr = s => s.match(/.{3}/g).map(c => '#' + c);

let BTN_THEMES = [
  Clr("123456045"),
  Clr("06a3bf08c"),
  Clr("950eb2a70"),
  Clr("62d85a73e") 
];
export let CONTROLLER_BUTTONS = [
  [12,  384, 84, 104, '◀', 0],
  [620, 452, 164, 42, '▲', 0],
  [102, 384, 84, 104, '▶', 0],
  [292, 434, 68,  46, 'UNDO [Z]', 1],
  [366, 434, 68,  46, 'RESET [R]', 1],
  [440, 434, 68,  46, 'PREV [P]', 1],
  [524, 430, 76,  52, 'SOUL [C]', 2],
  [620, 406, 164, 42, 'RAM [X]', 3]
];
export let
  drawControllerButtons = _ => {
    if (hideUI) return;
    CONTROLLER_BUTTONS.forEach(([x, y, w, h, txt, themeId], i) => {
      const active = gameState.activeButtons.has(i);
      const [baseCol, hiCol, actCol] = BTN_THEMES[themeId];

      draw3DButton(x, y, w, h, 1 ? actCol : baseCol, hiCol, '#000', active);
      drawBitmapText3D(txt, x + w / 2, y + (h >> 1) - 4, txt.length > 1 ? 1 : 2, '#fff', '#000', 'center', 2);
    });
  },
  UI=_=>{

    FR(0, 0, 800, 38,'#012');
    FR(0, 36, 800, 2,isUpside ? '#822' : '#f9c');
    SR(0, 0, 800, 38,isUpside ? '#a22' : '#f9c');
    let g = gameState, d = g.levelData;
    drawBitmapText3D(d?.name == 'Boss' ? 'BOSS' : 'LVL:' + -~g.currentLevelIndex, 12, 12, 2, '#f78', '#814', 'left', 3);
    drawBitmapText3D(isUpside ? 'RAM OR SACRIFICE' : 'RAINBOW', 405, 13, 2, isUpside ? '#fdd' : '#cdf', '#555', 'center', 3);
    drawBitmapText3D('MUTE:' + (isMuted ? 'ON' : 'OFF'), 545, 13, 1, isMuted ? '#fdd' : '#cef', '#555', 'center', 3);
    drawBitmapText3D('UI:' + (hideUI ? 'HIDE' : 'SHOW'), 620, 13, 1, hideUI ? '#ff9' : '#cfd', '#555', 'center', 3);
    drawBitmapText3D('TIMER:' + (isUpside ? M(0, gameState.timer).toFixed(1) : 'INF'), 732, 13, 2, isUpside ? '#f46' : '#fc1', '#000', 'center', 3);
    drawControllerButtons();
    let q = gameState.levelData?.characterQueue,
    qIdx = gameState.queueIndex,
    rem = M(0, q.length - qIdx);
    if (rem >= 27) {
      FR(92, 12, 12, 12, gameState.isGameOver ? '#345' : CHARACTER_PALETTES[q[qIdx]][3] || CHARACTER_PALETTES[q[0]][3]);
      SR(92, 12, 12, 12, '#fff');
      drawBitmapText3D(`x ${rem}`, 112, 14, 1, '#fff', '#000', 'left', 1);
    } else {
      let start = q.length <= 26 ? 0 : qIdx;
      for (let i = 0, len = q.length - start; i < len; i++) {
        let idx = start + i,
              bx = 92 + (i % 13) * 13,
              by = 12 + (i / 13 | 0) * 13,
              isActive = idx === qIdx && !gameState.isGameOver,
              pad = isActive ? 1 : 2;
        FR(bx, by, 12, 12, '#666');
        FR(bx + pad, by + pad, 12 - pad * 2, 12 - pad * 2, CHARACTER_PALETTES[q[idx]][3]);
        isActive && SR(bx, by, 12, 12, '#fff');
      }
    }
    // =========================================================================
// 結算畫面渲染 (JS13KB 極限化簡版：單一管線 + 純 3 碼 HEX)
// =========================================================================
  if (gameState.isGameOver || gameState.gameComplete) {
      let L = gameState.isGameOver,
          q = gameState.levelData?.characterQueue || [],
          qIdx = gameState.queueIndex,
          rem = q.length - qIdx,
          bodies = gameState.bodies.length;

      FR(0, 0, 800, 500, '#0008');
      draw3DButton(170, 70, 460, 340, L ? '#100' : '#021', L ? '#911' : '#183', L ? '#400' : '#031');
      SR(180, 80, 440, 320,L ? '#f43' : '#2c5');

      drawBitmapText3D(L ? "GAME OVER" : "VICTORY!", 400, 100, 3, L ? '#f43' : '#fc1', '#000', 'center', 4);
      drawBitmapText3D(L ? "ALL PLAYER SACRIFICED" : "RAINBOW GLADE", 400, 140, 1, L ? '#fca' : '#8fa', '#000', 'center', 2);

      FR(200, 170, 400, 140, '#0008'); // 替換 rgba，省下 10 Bytes
      SR(200, 170, 400, 140,L ? '#711' : '#142',1);
      drawBitmapText3D(L ? "--- SETTLEMENT SUMMARY ---" : "--- MISSION COMPLETE ---", 400, 185, 1, '#ffa', '#000', 'center', 2);

      [
          (L ? "STAGE: " : "CLEARED: ") + (gameState.levelData?.name || ''),
          L ? `PLAYER USED: ${N(qIdx, q.length)} / ${q.length}` : `PLAYER REMAINING: ${rem}`,
          (L ? "SACRIFICED BODIES: " : "BODIES LEFT BEHIND: ") + bodies
      ].forEach((txt, i) => drawBitmapText3D(txt, 220, 215 + i * 25, 1, '#fff', '#000', 'left', 2));

      draw3DButton(260, 320, 280, 50, L ? '#d22' : '#1a4', L ? '#f87' : '#4d8', L ? '#711' : '#142');
      drawBitmapText3D(L ? "RETRY [R]" : "PLAY AGAIN", 400, 336, 2, '#fff', '#000', 'center', 3);
  }
  },
  Back=_=>{
    FR(0,0,canvas.width,canvas.height,isUpside?"#200":"#123")
    V()
    TS(-gameState.camera.x | 0, -gameState.camera.y | 0);
    if (isUpside) {
      S("#9114");
      B();
      for (let i = -1e3; i < 2e3; i += 40)
        MT(i, -1e3), LT(i, 2e3),
        MT(-1e3, i), LT(2e3, i);
      K();
    }
  }
  ;