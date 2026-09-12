import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// 💡 自動導入並設定 ffmpeg 執行檔路徑，免去系統安裝麻煩
ffmpeg.setFfmpegPath(ffmpegPath);

// 定義輸入的 AVI 檔案與輸出的 GIF 檔案路徑
const inputAvi = '../img/2026.avi';
const outputGif = '2026.gif';

ffmpeg(inputAvi)
  // 調整濾鏡以優化 GIF 顏色調色盤（合併了 FPS 15 與寬度 480，並採用高品質雙通道演算法）
  .outputOptions([
    '-vf fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse'
  ])
  .output(outputGif)
  .on('start', (commandLine) => {
    console.log('轉換開始，執行指令: ' + commandLine);
  })
  .on('progress', (progress) => {
    console.log(`處理中: 已完成 ${progress.percent ? progress.percent.toFixed(2) : 0}%`);
  })
  .on('end', () => {
    console.log('轉換成功！GIF 已生成。');
  })
  .on('error', (err) => {
    console.error('轉換發生錯誤: ' + err.message);
  })
  .run();