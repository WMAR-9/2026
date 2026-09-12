let SONGS={
1:{s:.05,t:[
[0,0,.3,80,[19,21,23,24,26,28],['8040','2804','8402','0808']],
[.1,0,.1,80,['kick','snare','openhat'],['8080','0808','8080','0808','0f00','00f0','0f00','00f0']]
]},
2:{s:.5,t:[
[0,1,.15,10,[13,14,19],['808','4d3','324']],
[.1,0,.1,60,['openhat','kick','tom'],['111','222','884']]
]}
};

let SFX=[
[5,0,1.2,.18,0,36],
[4,4,1.4,.25,0,0],
[28,1,1.2,.3,0,-28],
[40,2,.9,.15,0,10],
[35,0,.8,.35,0,-8],
[24,0,1.2,.35,0,36]
];

export let 
Ad=S=>{
let A,T,P=0,I,L=1,Tr=[],sw=0,W=['square','sawtooth','triangle','sine'],
H=s=>[...s].flatMap(c=>[8,4,2,1].map(b=>!!(parseInt(c,16)&b))),
X=(n,w=0,v=1,d=.1,t,s)=>{
if(isMuted)return;
if(!A)A=new(window.AudioContext||webkitAudioContext)();
if(A.state=='suspended')A.resume();
t=t||A.currentTime;
let g=A.createGain();
g.connect(A.destination);
if(w<4){
let o=A.createOscillator();
o.type=W[w]||'square';
o.frequency.setValueAtTime(130.81*2**(n/12),t);
if(s!==undefined)o.frequency.exponentialRampToValueAtTime(130.81*2**(s/12),t+d);
g.gain.setValueAtTime(.15*v,t);
g.gain.exponentialRampToValueAtTime(1e-4,t+d);
o.connect(g);o.start(t);o.stop(t+d+.05)
}else{
if(n==4||n=='kick'){
let o=A.createOscillator();
o.frequency.setValueAtTime(150,t);
o.frequency.exponentialRampToValueAtTime(30,t+d);
g.gain.setValueAtTime(1.2*v,t);
g.gain.exponentialRampToValueAtTime(1e-3,t+d);
o.connect(g);o.start(t);o.stop(t+d)
}else{
let b=A.createBuffer(1,A.sampleRate*(d||.1),A.sampleRate),buf=b.getChannelData(0);
for(let i=0;i<buf.length;i++)buf[i]=Math.random()*2-1;
let src=A.createBufferSource();
src.buffer=b;
let fl=A.createBiquadFilter();
fl.type='highpass';
fl.frequency.value=(n==2||n=='snare')?1000:7500;
g.gain.setValueAtTime(((n==2||n=='snare')?.7:.4)*v,t);
g.gain.exponentialRampToValueAtTime(1e-4,t+d);
src.connect(fl);fl.connect(g);src.start(t);src.stop(t+d)
}
}
},
R=()=>{
if(!P||isMuted)return;
let now=A.currentTime,ended=1;
Tr.forEach(tr=>{
let sp=15/tr.b;
while(tr.t<now+.1){
if(tr.s<tr.maxS||L){
let T=tr.t+(tr.s%2?sp*sw:0);
tr.g.forEach((r,i)=>{if(r[tr.s%tr.maxS])X(tr.n[i],tr.d?4:tr.w,tr.v,sp*.85,T)});
tr.t+=sp;tr.s++
}
}
if(L||tr.s<tr.maxS)ended=0
});
if(ended){P=0;return}
T=setTimeout(R,25)
},
st=()=>{P=0;clearTimeout(T)};
return{
play(id,lp=1){
st();let song=S[id];if(!song)return;
P=1;I=id;L=lp;sw=song.s||0;
if(!A)A=new(window.AudioContext||webkitAudioContext)();
if(A.state=='suspended')A.resume();
Tr=song.t.map(t=>({
d:t[0],w:t[1],v:t[2]??1,b:t[3]||120,n:t[4],
g:t[5].map(r=>typeof r=='string'?H(r):r),
maxS:t[5][0]?(typeof t[5][0]=='string'?t[5][0].length*4:t[5][0].length):16,
s:0,t:A.currentTime+.05
}));
if(!isMuted)R()
},
stop:st,
pause(){P=0;clearTimeout(T)},
resume(){
if(I&&!P){
P=1;
if(A&&A.state=='suspended')A.resume();
Tr.forEach(t=>t.t=A.currentTime+.05);
if(!isMuted)R()
}
},
sfx:X
}
},
audioPlayer=Ad(SONGS),
isMuted=0,
hideUI=0,
musicStarted=0,
currentSong=1,
getAudioContext=_=>audioPlayer&&!isMuted&&(audioPlayer.sfx(0,3,0,.01),!musicStarted&&(audioPlayer.play(currentSong,1),musicStarted=1)),
switchSong=id=>currentSong!=''+id&&(currentSong=''+id,musicStarted&&!isMuted&&audioPlayer?.play(currentSong,1)),
playSound=t=>audioPlayer&&!isMuted&&(SFX[t]?audioPlayer.sfx(...SFX[t]):t==5&&[24,28,31,36].map((n,i)=>setTimeout(()=>audioPlayer.sfx(n,2,1,.3),i*90))),
toggleMute=_=>(isMuted=!isMuted,isMuted?audioPlayer?.pause():(musicStarted?audioPlayer?.resume():(audioPlayer?.play(currentSong,1),musicStarted=1))),
toggleHide=_=>hideUI=!hideUI;