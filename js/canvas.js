import { doc } from "./basic";

export let
  createC =_=> doc.createElement('canvas'),
  gc = a => a.getContext('2d'),
  setWH = (a, w = 32, h = 32) => (a.width = w, a.height = h),
  canvas = doc.getElementById('a'),
  ctx = canvas ? gc(canvas) : null,
  CC=a=>canvas=doc.getElementById('a'),
  CT=a=>ctx=gc(a),
  F = a => ctx.fillStyle = a,  
  S = a => ctx.strokeStyle = a,
  W = a => ctx.lineWidth = a,  
  A = a => ctx.globalAlpha = a,
  B =_=> ctx.beginPath(),   
  K =_=> ctx.stroke(),           
  V =_=> ctx.save(),        
  T =_=> ctx.restore(),
  MT=(x,y)=>ctx.moveTo(x,y),
  LT=(x,y)=>ctx.lineTo(x,y),
  R = (x, y, w, h) => ctx.fillRect(x, y, w, h),
  FR = (x, y, w, h,c) => (c && F(c), R(x,y,w,h)),
  SR = (x, y, w, h,c,s=2) => (c && S(c) && W(s), ctx.strokeRect(x,y,w,h)),
  LD = a => ctx.setLineDash(a),
  TS=(x,y)=>ctx.translate(x,y),
  RT=a=>ctx.rotate(a)
;