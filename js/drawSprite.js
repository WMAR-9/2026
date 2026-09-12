import { AB, M, N, normDeg, PI, Pixel,us } from "./basic";
import { ctx, FR, R, RT, T, TS, V,F, MT, LT, K, W, S, B, SR, LD } from "./canvas";
import { isUpside } from "./core";

let CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:-/ []◀▶▲",
      GLYPHS = "ehhvhhhuhhuhhuehgggehsihiiisvgguggvvggugggehgjhffhhhvhhhe44444e3111hhehikokihggggggvhrllhhhhpljhhhehhhhheuhhugggehhhliduhhukihfgge11uv444444hhhhhhehhhhha4hhhlllahha4ahhhha4444v1248gvehjlphe4c4444eeh1248vv2421he26aiv22vgu11he68guhhev124888ehhehhfehhf12c00000cc0000c484444404eh124040cc0cc0000v0001248g000000000e88888ee22222e26eue628cefec84ev4400",
      FONT = GLYPHS.match(/.{7}/g);
let P = s => s.match(/.{3}/g).map(c => '#' + c);

export let
  PALETTE                 = P("000fffe90fb0668"),
  jump_monster_PALETTE    = P("102fa1d70731fff"),
  walk_monster_PALETTE     = P("102547324112fff"),
  shooter_monster_PALETTE = P("000537fffb12102"),
  MONSTER_FLASH_PALETTE   = P("fffffffffffffff"),
  CHARACTER_PALETTES = "f46b14502c41f71410ff1dd17412c61840313bf08c04766f44c225a5f72e406"
    .match(/.{9}/g)
    .map(s => ["#000", "#fff", ...P(s)]),
  jump_monster = [
    [23, 31, "###################################################&##########)***$######)******####)62111*$#6##*21111*#6##<03=833$6##)-1>263+#6##<019->1$#)&*-1>>63+$6##<03=891$6##)-2111=,#)&#<621118$)&##*******#)&#)222222&####5111117####)1****1$###)+0111+0$###)******$######01+#########<,#########01+#########<,#########01+#########0,##########-#########&##5######;<<<<<$#"],    
    [23, 31, "#####&##########******$####)8111+)####)61111+$#6##*=19<=+#6##<079+>1$6##)-1=>63+#6##<019,>1$#)&*-=1?<2+$6##<611119$6##)-81117,#)&#<******$)&##*03333*#)&#)1,,,,1$###)+0111+0$###)******$######01+#########B,#########01+#########B,#########01+#########B,#########01+#########B,#########01+#########B,#########01+#########0,##########,#########&##5######ABBBBB$#"]
  ],
  walk_monster = [       
    [29, 29, "###111############*=+**'#########;+*8,*#######88***68*######-******,<######)******<$######+*******####58<**01***$####)****CF+0+######***0C404$######***01***######5*******$#####5****<8,6#####5********#####5********6####5*********6####,*,*******6###,*#********6##5*#)******)*6#/*$#)*****$)*$#**$#*.****#**#5**#)*****##)$#8*$#)****$#####,$##)****##########)***###########>?$##########88?'#########5>??##########5>'##########"],
    [29, 29, "###/11+***$#######/******%########*****-%######1******-#####/1********######)**01***$#####/***C4*0+#####1+**0F404$#####/***01*1*######)*******$#####8****<2,<#####>*****68<#####=********'####+********<####+*0+******'###/*'/*******%###*$#+*******%##**$/********1#/**#)*****$**0#+*$#)**.*$#-*3#=$##*****##+*'####)****###+*###)*****########)*****$#######)*****########)*#**$#########*##)$#########)###########################"]
  ],
  shooter_monster = [
    [15, 13, "##***$##)0111*#)0=882(/+1>>?-##078E@$#+18>F-#%078??$#)1988C##*111C(##).**####0$0$###0$#0$##)$##*##"],
    [15, 13, "##***$##)0111*#A4=882(/C1>??D##47>F9(#C18E@D#%47>?9(#A1988C##F111C$##)***####4*+#####00$#####$*###"],
    [15, 13, "##***$##)0111*#)0=882$/+1>>?-##078-<0#+18>*-)%078??0#)1988+##*111+$##)***###)+#0$###0$)+####$#)###"]
  ],
  hors = [
    [32, 22, "###########################)*##*##########)68$),##########6>?,6$#########*?9?--#########)>?*>9,#########6?806>?$########6?,1+*8$#######*>?,111*########6??01+1+####)*$)>?901+1+$###6?,#68801111$##)>?9****21111$)*)?8B11111111+#69<9,0111117**$#)<?9$011111+#####)8,#011111$######*$#011111+########)0+01101$#######010+*B.1.#######B.).#*.B.#######)$)*#)*)*###"],
    [32, 22, "##########################)*##*##########*68$),#########)8>?-6$#########6???-,##########6?*>?,#########)>906>?$########)>,1+*>$#######**?,1116$#######6??01+1+$####)$)8?901+1+#####6,#68,01111$###)?9***611111$#)#<9801111111+##6*>8*411111,*$##6??,)111111$####)>9$)111+1+######**#)11101B#########)11+1+0(########0+0*100C#######)F$B$B.)F$#######*#*$)*#*$###"],
    [32, 22, "############*$#)##########)*>-$<##########6???,>#########*88>?6-########)>9*6?8,#########690+>-$#########<9016*########)*>D11+,$#######)??D110,*###**$#668,1101+##)>?-#)8801111+)#)?99****21111*6*698B11111111+$)??9*01111117**#)>?8$0111111+####68,#0111111*####)*$#A111111+$#######41B011+C$######A1+B***4B$######01B.##)1B$######B.F$##)F*#######)$*####*####"],
    [32, 22, "###############*###########*$#),#########)*8,#6$#########*8??*,#########*<???6$########)>?,6?9$########6??0+>?,########6?901*6,#######)6>-111+$####)$#)8?-11+1$####6,#)>?,11+1$#$#)??$)88,1111+#,$<9>-***61111+#<-?8*411117111$#)>?,)111111***###68$)111111+#####)*#)11111+1*#######B111111+4*#####)41.11+B4B.#####BCFB**$)B.*#####B..#####)*######)$$##########"],
    [32, 16, "############*##*#########*,*8$),########)888?-6$####)F(#66?*?-,#F(##<$A),*?06?9$#)$)?-#)??90+8?,#)-<9>*68?,01*8*#)>?864+88*111*$##*8$)11**0110+####*#)11111110+#AFA()*11111111+#####01111111**$###F#B*+01+1B$#######*#$$BB0+.#########))..)CB$#############*)###"],
    [32, 16, "#########***###########))8>-$###)#)*###**>?*,###6*6>$#)88?-,8$##<8>?-*6??-0+?$##)??**18**61=?**$#<-#0111111+?88,#)$#0111111>?,*$###)011111107,#####01+0111108$####).**.11+011$#####$###**4*01$###########0CB.$###########BF*.############)*#####################"],
    [32, 10, "###########*$############**?-#########**)>8>?$#####)*)11696+?-*$###<9016?,2*??8,##*?-11+,*1+?8-$)*?90111011+>,$#6>?,011F111*>,##)88*11F41CC,86###**)***F**F.**##"]
  ],
    drawRawBitmap = (text, startX, startY, p, color) => {
      F(color);
      for (let i = 0, cx = startX; i < text.length; i++, cx += 6 * p) {
        let g = FONT[CHARS.indexOf(text[i])] || "0000000";
        for (let j = 0; j < 35; j++)
          (parseInt(g[j / 5 | 0], 36) >> (4 - j % 5)) & 1 &&
          FR(cx + (j % 5) * p, startY + (j / 5 | 0) * p, p, p);
      }
    },
    drawBitmapText3D = (text, x, y, p = 2, col = '#fff', shCol = '#000', align = 'left', depth = 2) => {
      text = us('' + text);
      let tw = text.length * 6 * p,
          cx = align == 'center' ? x - tw / 2 : align == 'right' ? x - tw : x,
          off = p >= 2 ? 1.5 : 1;
      for (let d = depth; d > 0; d--) drawRawBitmap(text, cx + d * off | 0, y + d * off | 0, p, shCol);
      drawRawBitmap(text, cx | 0, y | 0, p, col);
    },
    draw3DButton = (x, y, w, h, base, hi, sh, pressed = 0) => {
      FR(x + 2, y + 2, w, h, '#0005');
      FR(x, y + (pressed ? 2 : 0), w, h - (pressed ? 2 : 0), base);
      pressed || (
        FR(x, y, w, 2, hi), FR(x, y, 2, h),
        FR(x, y + h - 2, w, 2, sh), FR(x + w - 2, y, 2, h)
      );
    },
  drawSprite = (arr, id, x, y, s = 1, fl = 0, pal = PALETTE) => {
        let k = arr[0]?.pop,
            w = k ? arr[id][0] : arr[0],
            h = k ? arr[id][1] : arr[1],
            d = k ? arr[id][2] : arr[2 + id],
            ox = -w * s / 2, oy = -h * s / 2, lc = "", c, v, py;

        V();
        TS(x|0,y|0);
        fl && ctx.scale(-1, 1);

        for (let i = 0; i < d.length * 2; i++) {
        c = d.charCodeAt(i >> 1);
        v = (((c - (c > 91)) - 35) / (i & 1 ? 6 : 1) | 0) % 6;
        py = i / w | 0;
        v && py < h && (
            (c = pal[v - 1]) != lc && (ctx.fillStyle = lc = c),
            R(ox + (i % w) * s, oy + py * s, s, s)
        );
        }
        T();
  },
  drawDiamondProjectile=(x, y, angle = 0, colorId=0,p = Pixel)=>{
  
      let pal = CHARACTER_PALETTES[colorId];
      let C = [pal[1] || '#fff', pal[0] || '#111', pal[2] || '#0f0', pal[3] || '#f00', pal[1] || '#fff'];
      V()
      TS(x, y)
      if (angle) RT(angle);
      [[8,2], [8,14], [2,8], [14,8]].forEach(([px, py]) => FR((px-8)*p, (py-8)*p,p,p,C[0]));
      for (let r = 0; r < 16; r++)
        for (let c = 0; c < 16; c++) {
          let d = AB(c - 8) + AB(r - 8);
          if (d <= 5) FR((c-8)*p, (r-8)*p,p,p,d <= 2 ? C[3] : d <= 4 ? C[2] : C[1]);
        }
      [[6,7], [6,8], [7,6], [7,7]].forEach(([px, py]) => FR((px-8)*p, (py-8)*p,p,p,C[4]));
      T()
  },
  drawPixelSpikes=(x, y, w, h, dir = 'u', theme = 0, p = Pixel)=>{
      let u = p * 4, d = M(0, "udlr".indexOf(dir[0])), isV = d < 2;
      let count = M(1, ~~((isV ? w : h) / u));
      let [rot, tx, ty] = [[0, 0, 0], [1, u, u], [-0.5, 0, u], [0.5, u, 0]][d];
      let C = theme ? ['000', 'e46', 'e25', '914']:['000', 'fff', '4ef', '24b'];
      x = ~~(x / p) * p; y = ~~(y / p) * p;
      for (let i = 0; i < count; i++) {
        V(); TS((isV ? x + i * u : x) + tx, (isV ? y : y + i * u) + ty);
        if (rot) RT(rot * PI);
        for (let j = 0; j < 4; j++) {
          FR((1.5 - j * 0.5) * p, j * p, (j + 1) * p, p,'#'+C[0]);
          if (j) FR((2 - j * 0.5) * p, j * p, j * p, p,'#'+C[j]); 
        }
        T();
      }
  },
  drawPixelCloud=(x, y, w, h, p = Pixel)=>{
      x = ~~(x / p) * p; y = ~~(y / p) * p; w = ~~(w / p) * p; h = ~~(h / p) * p;
      if (w < 2 * p || h < 2 * p) return;

      let [black, white, cyan, dark, blue] = ["#000", "#fff", "#4ef", "#24a", "#124"];
      let nim = M(2, (w / (8 * p))|0), S = ~~(w / nim / p) * p;

      FR(x + p, y, w - 2 * p, h,blue); 
      FR(x, y + p, w, h - 2 * p,blue);

      for (let i = 0; i < 2; i++) {
        let X = i ? x + w - 2 * p : x + p, m = N(h - 2 * p, (i ? 8 : 10) * p);
        FR(X, y + p, p, m,dark); 
        FR(X, y + p, p, ~~(m * (i ? .5 : .6) / p) * p,cyan); 
        FR(X, y + p, p, ~~(m * (i ? .25 : .3) / p) * p,white);
      }
      if (h >= 18 * p) {
        for (let Y = y + 12 * p; Y < y + h - 6 * p; Y += 12 * p) {
          FR(x + p, Y, p, 3 * p,dark); FR(x + w - 2 * p, Y + 4 * p, p, 3 * p,dark);
          FR(x + 2 * p, Y + p, p, 2 * p,cyan); FR(x + w - 3 * p, Y + 3 * p, p, 2 * p,cyan);
          FR(x + 2 * p, Y + 2 * p,white); FR(x + w - 3 * p, Y + 4 * p,white);
        }
      }
      const T = N(~~(h * .35 / p) * p, 4 * p);
      FR(x + p, y + p, w - 2 * p, T, white);
      FR(x + p, y + T + p, w - 2 * p, p, cyan);
      for (let i = 0; i < nim; i++) {
        let sx = x + i * S, sw = i === nim - 1 ? x + w - sx : S;
        FR(sx + 2 * p, y - p, sw - 4 * p, p, white);
        FR(sx + p, y, sw - 2 * p, p);
        FR(sx + 2 * p, y - 2 * p, sw - 4 * p, p, black);
        FR(sx + p, y - p, p, p);
        FR(sx + sw - 2 * p, y - p, p, p);
        if (i) FR(sx - p, y, 2 * p, p);
      }
      FR(x, y, p, h - p);
      FR(x + w - p, y, p, h - p);
      FR(x + p, y + h - p, w - 2 * p, p);
  },
  drawPixelInsideBlood = (x, y, w, h, p = Pixel) => {
    x = ~~(x / p) * p;
    y = ~~(y / p) * p;
    w = ~~(w / p) * p;
    h = ~~(h / p) * p;
    if (w < 2 * p || h < 2 * p) return;
    let [black, charcoal, darkRed, midRed, brightRed, deepRed] = [
      "#000", "#111", "#914", "#e25", "#f46", "#a14"
    ];
    FR(x, y, w, h, charcoal);
    for (let i = 0; i < 2; i++) {
      let X = i ? x + w - 2 * p : x + p,
          m = N(h - 2 * p, (i ? 8 : 10) * p);
      FR(X, y + p, p, m, darkRed);
      FR(X, y + p, p, ~~(m * (i ? 0.4 : 0.5) / p) * p, midRed);
    }
    let maxH = h - 3 * p;
    for (let i = 0, cx = x + 2 * p; cx < x + w - 2 * p; cx += p, i++) {
      let d = +"124310252013202410"[i % 18],
          dL = N(d * p, maxH);
      if (dL) {
        FR(cx, y + 2 * p, p, dL, darkRed);
        if (dL >= 3 * p) {
          FR(cx, y + 2 * p, p, dL - p, midRed);
      
          FR(cx, y + p + dL, p, p, brightRed);
        }
        if (d >= 4 && y + 4 * p + dL <= y + h - 2 * p) {
          FR(cx, y + 4 * p + dL, p, p, midRed);
        }
      }
    }
    if (h >= 20 * p) {
      for (let Y = y + 12 * p; Y < y + h - 6 * p; Y += 12 * p) {
        FR(x + p, Y, p, 3 * p, darkRed);
        FR(x + w - 2 * p, Y + 4 * p, p, 3 * p);
        FR(x + 2 * p, Y + 2 * p, p, p, midRed);
        FR(x + w - 3 * p, Y + 5 * p, p, p);
      }
    }
    FR(x + p, y + p, w - 2 * p, 2 * p, deepRed);
    FR(x + p, y + p, w - 2 * p, p, brightRed);
    FR(x, y, w, p, black);
    FR(x, y + h - p, w, p);
    FR(x, y, p, h);
    FR(x + w - p, y, p, h);
  },
   isBodyActiveInDimension = (b, isUp = isUpside) => isUp || b.originDimension == 1,

  isGateActiveInDimension = (gate, isUpsideDown, d = gate.dim ?? 0) =>(gate.isExit ? !isUpsideDown : !d === !isUpsideDown),
  drawBody = (body, currentDimension) => {
    if (!isBodyActiveInDimension(body, currentDimension)) return;
    if (!currentDimension) {
        drawPixelCloud(body.x - body.w / 2, body.y - body.h / 2, body.w, body.h);
        return;
    }

    let type = body.charType ?? 0;
    // 直接以數字 type 索引起碼
    let pal = CHARACTER_PALETTES[type] || PALETTE;
    let frame = body.isPinned ? 5 : 6;

    drawSprite(hors, frame, body.x, body.y, 2, body.facing == (body.isPinned || -1), pal);
  },
  getFrameForPlayer = (p, tick) =>(p.isRamming ? 5 : !p.isGrounded ? (p.vy < -2 ? 2 : p.vy <= 2 ? 3 : 4) : AB(p.vx) > .3 ? +"0121"[tick / 6 & 3] : 0),
  drawPlayer=(body,tick=0)=>{
    let type = body.charType || 0;
    let pal = CHARACTER_PALETTES[type] || PALETTE;
    let frame = getFrameForPlayer(body, tick);

    drawSprite(hors, frame, body.x, body.y, 2, body.facing<0, pal);
  };
  
// =========================================================================
// 1. 開關渲染 (drawSwitch) - 移除多餘的 ctx 引數，嚴格 3 碼 HEX
// =========================================================================
export const drawSwitch = (
  sw,
  o = sw.isPressed ? 5 : 0,
  x = sw.x,
  y = sw.y + o,
  w = sw.w,
  h = sw.h - o,
  T = sw.type, // 0: 魂/出口, 1: 光
  M = sw.mode  // 0: 出口/普通, 1: 魂犧牲
) => (
  // 1. 底色：按下為綠(#2c5)；未按下依序對齊光(#ea0)、魂(#a5f)、出口(#d22)
  FR(x, y, w, h, sw.isPressed ? '#2c5' : (T ? '#ea0' : (M ? '#a5f' : '#d22'))),
  SR(x, y, w, h, '#fff'),
  // 2. 文字：按下為亮綠(#8fa)；未按下對齊門的文字色
  drawBitmapText3D(
    sw.label || (T ? 'LIGHT' : (M ? 'SOUL' : 'EXIT')),
    x + w / 2,
    sw.y - 14,
    1,
    sw.isPressed ? '#8fa' : (T ? '#ffa' : (M ? '#c8f' : '#fed')),
    '#000',
    'center',
    2
  )
);

// =========================================================================
// 2. 閘門渲染 (drawGate) - 極限精簡版 (確保顏色與開關完全一致)
// =========================================================================
export const drawGate = (
  gate,
  isUpsideDown = isUpside,
  cx = gate.x + gate.w / 2,
  isL = gate.gt, // 0: SOUL, 1: LIGHT
  [fill, stroke, col, txt] = gate.isExit
    ? ['#d22', '#fca', '#fed', 'EXIT']
    : isL ? ['#ea0', '#ffa', '#ffa', 'LIGHT']
          : ['#a5f', '#edf', '#c8f', 'SOUL']
) => (
  (!gate.isExit && gate.dim != isUpsideDown) ? 0 : (
    V(),
    isUpsideDown && gate.isExit && (ctx.globalAlpha = 0.4),
    W(3),
    gate.isOpen ? (
      LD([4, 4]),
      SR(gate.x, gate.y, gate.w, gate.h, gate.isExit ? '#2c5' : (isL ? '#fc1' : '#3bf')),
      LD([]),
      drawBitmapText3D('OPEN', cx, gate.y - 14, 1, '#8fa', '#000', 'center', 2)
    ) : (
      FR(gate.x, gate.y, gate.w, gate.h, fill),
      SR(gate.x, gate.y, gate.w, gate.h, stroke),
      drawBitmapText3D(txt, cx, gate.y - 14, 1, col, '#000', 'center', 2)
    ),
    T() // 複用 canvas.js 的 T() 取代 ctx.restore()，再省數個位元組
  )
);
// =========================================================================
// 3. 鏡面渲染 (drawMirror) - 移除多餘的 ctx 引數
// =========================================================================
export const drawMirror = (
  m,
  cx = m.x + m.w / 2,
  cy = m.y + m.h / 2,
  dH = 32,
  dW = (dH * m.w / m.h + .5) | 0,
  isWood = m.type > 1
) => (
  V(),
  m.type === 3 && (
    S('#9ab'),
    W(3),
    B(),
    MT(m.railMinX, cy),
    LT(m.railMaxX, cy),
    K(),
    FR(m.railMinX - 4, cy - 6, 8, 12, '#cde'),
    FR(m.railMaxX - 4, cy - 6, 8, 12)
  ),
  TS(cx, cy),
  RT(normDeg(m.angle) * PI / 180),
  FR(-dW / 2, -dH / 2, dW, dH, isWood ? '#531' : '#456'),
  FR(-dW / 2 + (isWood ? 2 : 3), -dH / 2 + (isWood ? 2 : 3), dW - (isWood ? 7 : 6), dH - (isWood ? 4 : 6), '#3bf'),
  isWood ? (
    FR(-dW / 2 + 4, -dH / 2 + 4, ((dW - 7) / 3) | 0, 2, "#fff"),
    FR(dW / 2 - 5, -dH / 2 + 2, 3, dH - 4, "#321")
  ) : (
    FR(-2, -2, 4, 4, m.lightActive ? '#fff' : '#f46')
  ),
  ctx.restore(),
  
  drawBitmapText3D(
    isUpside
      ? '[X]' + (m.type < 2 ? 'BEAM' : ' ' + (m.angle | 0))
      : ['LIGHT', 'MIRROR', 'TRACK'][m.type - 1],
    cx - 20,
    m.y - 12,
    1,
    isUpside && m.type < 3 ? '#fca' : '#cde'
  )
);

export const drawMonster = (
  mon,
  T = mon.type,
  hc = mon.hitCooldown || 0,
  hit = hc > 0 && !(hc / 4 & 1),
  isBW = T === 1 || T === 4,
  S = isBW ? walk_monster : (T === 2 ? shooter_monster : jump_monster),
  scale = mon.scale || (T === 2 ? 8 : T === 4 ? 4 : T === 3 ? 1.2 : 1.5),
  w = mon.w || S[0][0] * scale,
  h = mon.h || S[0][1] * scale,
  cx = mon.x + w / 2,
  tick = (typeof globalTick != 'undefined' ? globalTick : (Date.now() / 16 | 0)),
  f = isBW
    ? ((tick / (T === 4 ? 8 : 10)) | 0) % walk_monster.length
    : (T === 2 ? (mon.shootTimer < 20 ? 1 : (tick / 12 & 1 ? 2 : 0)) : (!mon.grounded | 0)),
  
  // 取得當前怪物數字號碼對應的主色與暗色
  colHex = CHARACTER_PALETTES[mon.color || 0]?.[2] || '#f43',
  darkHex = CHARACTER_PALETTES[mon.color || 0]?.[3] || '#501',
  
  pal = hit ? MONSTER_FLASH_PALETTE : (
    T === 1 ? walk_monster_PALETTE : (
      T === 2 ? shooter_monster_PALETTE : (
        T === 3 ? ["#101", colHex, "#ca0", "#731", "#fff"]
                : ["#101", colHex, darkHex, "#300", "#fff"]
      )
    )
  ),
  txt = T === 2 ? "PATROL" : (T === 3 ? "Chroma" : (T === 4 ? (hc > 0 ? "DMG!" : `HP:${mon.remainingColors?.length || 0}`) : 0)),
  tc = T === 2 ? '#c8f' : (T === 4 && hit ? '#fff' : colHex)
) => (
  (mon.isDefeated || (!isUpside && (T === 2 || (T === 4 && hc <= 0)))) ? 0 : (
    drawSprite(S, f, cx, (mon.y + h) - (S[f][1] * scale) / 2, scale, mon.dir < 0, pal),
    txt && drawBitmapText3D(txt, cx, mon.y - (T === 4 ? 14 : 12), 1, tc, '#000', 'center', T === 4 ? 2 : 1)
  )
);