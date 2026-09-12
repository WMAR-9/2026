import { getAudioContext, hideUI, playSound, switchSong, toggleHide, toggleMute } from "./audio";
import { canvas } from "./canvas";
import { executePastelSacrifice, gameState, isUpside, toggleUpside, undoLastSacrifice } from "./core";
import { loadLevel } from "./map";
import { handleStartInput, startState } from "./startView";
import { CONTROLLER_BUTTONS } from "./UI";

const ACTIONS = [
    undoLastSacrifice,
    _ => loadLevel(gameState.currentLevelIndex),
    _ => gameState.currentLevelIndex && loadLevel(gameState.currentLevelIndex - 1), 
    _ => !isUpside && executePastelSacrifice(),
    _ => !isUpside ? toggleUpside() : !gameState.isGameOver && (
        gameState.player.isRamming = 1,
        gameState.player.ramTimer = 10
    )
];

// 【新增】：多指觸控座標暫存池 (以手指 ID 為鍵)
let ptrs = {};

export let bindEvents = () => {
    const cvs = canvas;

    const handleKey = (e, isDown) => {
        getAudioContext();
        let c = e.code, k = e.key?.toLowerCase();

        if (startState < 3) return / |enter/.test(k) && handleStartInput();

        gameState.keys[c] = gameState.keys[k] = isDown;

        if (isDown) {
            /Arrow|[zrpcxm ]/i.test(e.key) && e.preventDefault();
            k == 'm' ? toggleMute() : ACTIONS['zrpcx'.indexOf(k)]?.();
        }
    };

    onkeydown = onkeyup = e => handleKey(e, e.type[5]);

    // 多指支援之指標核心
    const handlePointer = (e, isDown) => {
        getAudioContext();
        if (startState < 3) return isDown && handleStartInput();

        let act = gameState.activeButtons = gameState.activeButtons || new Set(),
            rect = cvs.getBoundingClientRect(),
            sx = cvs.width / rect.width,
            sy = cvs.height / rect.height;

        // 1. 維護當前螢幕上的多根手指座標
        if (e) {
            isDown 
                ? (ptrs[e.pointerId] = [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy])
                : (delete ptrs[e.pointerId]);
        } else {
            ptrs = {};
        }

        let pts = Object.values(ptrs);

        // 2. 頂部 UI 與結算按鈕判定 (以當前觸發事件的手指為準)
        if (e && isDown) {
            let [x, y] = ptrs[e.pointerId] || [];
            if (y <= 38) {
                if (x > 475 && x < 565) return toggleMute();
                if (x > 575 && x < 665) return toggleHide(), playSound(3);
            }

            if ((gameState.gameComplete || gameState.isGameOver) && x > 260 && x < 540 && y > 320 && y < 380) {
                playSound(3);
                return loadLevel(gameState.isGameOver ? gameState.currentLevelIndex : 0);
            }
        }

        // 3. 虛擬按鈕多指並行檢測：檢查是否有任一根手指落在按鈕範圍內
        if (!hideUI && CONTROLLER_BUTTONS) {
            CONTROLLER_BUTTONS.forEach(([bx, by, bw, bh], i) => {
                let active = pts.some(([px, py]) => px >= bx && px <= bx + bw && py >= by && py <= by + bh);
                
                if (active !== act.has(i)) {
                    active ? act.add(i) : act.delete(i);
                    if (i < 3) {
                        gameState.keys['Arrow' + ['Left', 'Up', 'Right'][i]] = active;
                        if (i === 1) gameState.keys.Space = active;
                    } else {
                        active && ACTIONS[i - 3]?.();
                    }
                }
            });
        }
    };

    cvs.onpointerdown = e => (e.preventDefault(), handlePointer(e, 1));
    onpointermove = e => handlePointer(e, e.buttons);
    onpointerup = onpointercancel = e => handlePointer(e, 0); // 傳入 e，僅釋放對應的 pointerId
};