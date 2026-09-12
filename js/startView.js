import { rand } from "./basic";
import { ctx, V, T, TS, RT, FR, SR, W, S, B, K, MT, LT } from "./canvas";
import { drawBitmapText3D } from "./drawSprite";
import { playSound } from "./audio";


export let startState = 0;

let ang = 0, frame = 0, shock = 0, lIdx = 0, cIdx = 0, txt = "",
    SCR = ["LEAVE YOUR FLESH TO PAVE THE WAY.", "LEAVE YOUR PASTEL SOUL.", "YOUR CORPSE IS THE ONLY KEY."];



const P = Array.from({ length: 24 }, () => [rand(800), rand(500), rand(2) + 1]);


export const handleStartInput = () => {
    !startState ? (startState = 1, shock = 25, playSound(2)) :
    startState == 2 && (
        cIdx < SCR[lIdx].length ? (cIdx = SCR[lIdx].length, txt = SCR[lIdx]) :
        ++lIdx >= SCR.length ? (startState = 3, playSound(2)) :
        (cIdx = 0, txt = "", playSound(2))
    );
};


export const renderStartView = () => {
    frame++; ang += .008;
    let sx = startState == 1 ? rand(10) - 5 : 0,
        sy = startState == 1 ? rand(10) - 5 : 0;

    
    [-1e3, 0].forEach((cx, isR) => {
        V(); TS(400 + sx, 250 + sy); RT(ang); B(); ctx.rect(cx, -1e3, 1e3, 2e3); ctx.clip(); RT(-ang); TS(-400 - sx, -250 - sy);
        FR(0, 0, 800, 500, isR ? '#212' : '#100');
        
        
        P.forEach(([px, py, s], i) => (i >= 12) == isR && (
            P[i][1] = isR ? (py <= 0 ? 500 : py - s) : (py >= 500 ? 0 : py + s),
            FR(px, P[i][1], isR ? 6 : 2, isR ? 6 : 8, isR ? '#f9c' : '#f03')
        ));

        drawBitmapText3D(isR ? 'SURFACE' : 'ABYSS', isR ? 770 : 30, 36, 2, isR ? '#f9c' : '#f03', '#000', isR ? 'right' : 'left', 2);
        T();
    });

    
    V(); TS(400 + sx, 250 + sy); RT(ang); W(startState == 1 ? 2 : 3); S(startState == 1 ? '#0ff' : (frame % 8 < 4 ? '#f05' : '#fff'));
    B(); MT(0, -1e3); LT(0, 1e3);
    if (startState == 1) for (let i = 6; i--;) MT(-40, rand(1e3) - 500), LT(40, rand(1e3) - 500);
    K(); T();

    
    if (startState == 1) {
        frame % 4 < 2 && FR(0, 0, 800, 500, '#0ff5');
        --shock <= 0 && (startState = 2, lIdx = cIdx = 0, txt = "");
    } else if (!startState) {
        drawBitmapText3D('UNICORPSE', 400, 210, 3, '#fff', '#000', 'center', 3);
        FR(290, 290, 220, 50, frame % 30 < 15 ? '#f05' : '#b03');
        SR(290, 290, 220, 50, '#fff');
        drawBitmapText3D('START GAME', 400, 308, 2, '#fff', '#000', 'center', 2);
    } else if (startState == 2) {
        FR(30, 390, 740, 80, '#000d'); SR(30, 390, 740, 80, '#0ff');
        let cur = SCR[lIdx];
        frame % 2 == 0 && cIdx < cur.length && (txt = cur.slice(0, ++cIdx));
        drawBitmapText3D(txt + (frame / 12 & 1 ? '_' : ' '), 50, 405, 1, '#fff', '#000', 'left', 1);
        drawBitmapText3D(`[${lIdx + 1}/${SCR.length}] CLICK / SPACE`, 50, 445, 1, '#f9c', '#000', 'left', 1);
    }
};