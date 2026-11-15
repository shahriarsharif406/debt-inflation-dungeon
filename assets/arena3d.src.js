import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';

const BASE=(document.currentScript&&document.currentScript.src)?document.currentScript.src.replace(/[^/]*$/,""):"assets/";
const A={ready:false,failed:false,onready:null};
window.Arena3D=A;
const M={};let renderer,scene,cam,canvas,hall=null,clock,torches=[],running=false,lastTime=0;
const inst={},stat={};let knight=null,coins=null,prevSum=null,floorTheme=0;
const THEME=[{fog:0x0c1020,amb:0x6a7aa8,torch:0xffa24d,tint:0x8fa0d8},{fog:0x160e0a,amb:0x9a7a60,torch:0xff9438,tint:0xd8a070},{fog:0x1a0a0e,amb:0x9a5560,torch:0xff6a3a,tint:0xd87080}];
const KIND={wyrm:{m:"demon"},golem:{m:"orc"},imp:{m:"blue"},vamp:{m:"creep"},hydra:{m:"blue",tint:0x3ddc84},emerg:{m:"demon",tint:0xff8a3d}};
const FILES={knight:"knight.glb",demon:"demon.glb",blue:"bluedemon.glb",orc:"orc.glb",wall:"wall.glb",floor:"floor_tile_large.glb",column:"column.glb",torch:"torch_mounted.glb",cs:"coin_stack_small.glb",cm:"coin_stack_medium.glb",cl:"coin_stack_large.glb",barrel:"barrel_large.glb",crates:"crates_stacked.glb",rubble:"rubble_half.glb",banner:"banner_shield_red.glb",chest:"chest_gold.glb",creep:"creep.glb"};
const ESSENTIAL=["knight","demon","blue","orc","wall","floor","column","torch","cl","cm","cs"];

function load(){
  const L=new GLTFLoader();let n=0;const need=ESSENTIAL.length;
  const done=k=>{if(ESSENTIAL.includes(k)){n++;if(n===need){try{build();A.ready=true;A.onready&&A.onready()}catch(e){console.warn("Arena3D build failed",e);A.failed=true}}}};
  Object.entries(FILES).forEach(([k,f])=>L.load(BASE+f,g=>{M[k]=g;done(k)},undefined,e=>{console.warn("Arena3D load",k,e);if(ESSENTIAL.includes(k))A.failed=true}));
}
function norm(g,h,posed){ // feet at y=0, height h; bbox measured in idle pose
  const o=skClone(g.scene);const grp=new THREE.Group();const w=new THREE.Group();w.add(o);grp.add(w);grp.userData.inner=w;grp.userData.o=o;grp.userData.h=h;return grp;
}
function fit(grp){const o=grp.userData.o,w=grp.userData.inner,h=grp.userData.h;o.position.set(0,0,0);w.scale.setScalar(1);grp.updateMatrixWorld(true);
  o.traverse(m=>{if(m.isSkinnedMesh){m.skeleton.update();m.computeBoundingBox&&m.computeBoundingBox()}});
  const box=new THREE.Box3().setFromObject(o,true);const s=h/(box.max.y-box.min.y||1);const c=box.getCenter(new THREE.Vector3());o.position.set(-c.x,-box.min.y,-c.z);w.scale.setScalar(s)}
function build(){
  canvas=document.createElement("canvas");canvas.className="a3d";
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,innerWidth<700?1.25:1.6));
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0c1020,.05);
  cam=new THREE.PerspectiveCamera(17,4.4,.5,120);
  clock=new THREE.Clock();
  // lights
  scene.add(new THREE.HemisphereLight(0x8a96c8,0x2a1c14,.5));
  const key=new THREE.DirectionalLight(0xffe2b8,1.05);key.position.set(-6,9,10);scene.add(key);
  const rim=new THREE.DirectionalLight(0x7fa8ff,.9);rim.position.set(8,5,-6);scene.add(rim);
  // measure tile sizes
  const fb=new THREE.Box3().setFromObject(M.floor.scene);const ft=Math.max(fb.max.x-fb.min.x,fb.max.z-fb.min.z)||4;
  const wb=new THREE.Box3().setFromObject(M.wall.scene);const ww=wb.max.x-wb.min.x||4,wh=wb.max.y-wb.min.y||4;
  const stage=new THREE.Group();scene.add(stage);
  // floor grid
  for(let ix=-9;ix<=9;ix++)for(let iz=-3;iz<=3;iz++){const t=skClone(M.floor.scene);t.position.set(ix*ft,-fb.min.y*0-(fb.max.y),iz*ft);t.position.y=-fb.max.y;stage.add(t)}
  // back wall + columns + torches
  const wallZ=-ft*1.5-1.2;
  for(let i=-10;i<=10;i++){const w=skClone(M.wall.scene);w.position.set(i*ww,-wb.min.y,wallZ);stage.add(w);
    const w2=skClone(M.wall.scene);w2.position.set(i*ww,-wb.min.y+wh,wallZ);stage.add(w2)}
  for(let i=-6;i<=6;i++){const c=skClone(M.column.scene);c.position.set(i*ww*2-ww*.5,0,wallZ+.8);c.scale.setScalar(1.15);stage.add(c)}
  const tpos=[-7,-2.2,2.6,7.4];
  tpos.forEach((x,i)=>{const t=skClone(M.torch.scene);t.position.set(x*ww/4*1.4,wh*.55,wallZ+.35);stage.add(t);
    const L=new THREE.PointLight(0xffa24d,60,26,1.6);L.position.set(t.position.x,t.position.y+.5,t.position.z+1.2);L.userData.seed=Math.random()*9;if(i===1||i===2){scene.add(L)}else{L.intensity=0;L.visible=false}torches.push(L);const gc=document.createElement('canvas');gc.width=gc.height=64;const gx=gc.getContext('2d');const gg=gx.createRadialGradient(32,32,1,32,32,32);gg.addColorStop(0,'rgba(255,230,160,1)');gg.addColorStop(.25,'rgba(255,150,50,.7)');gg.addColorStop(1,'rgba(255,100,20,0)');gx.fillStyle=gg;gx.fillRect(0,0,64,64);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));sp.scale.set(1.5,1.5,1);sp.position.set(t.position.x,t.position.y+1.05,t.position.z+.5);scene.add(sp);L.userData.glow=sp});
  // props
  const addP=(k,x,z,s,ry)=>{if(!M[k])return;const p=skClone(M[k].scene);p.position.set(x,0,z);p.scale.setScalar(s||1);p.rotation.y=ry||0;stage.add(p)};
  addP("barrel",-13.5,-2.6,1.2,.4);addP("crates",13.5,-2.4,1.2,-.3);addP("rubble",-9.2,-2,.45,0);addP("rubble",10.4,-1.6,.4,2);
  if(M.banner){[-4.2,5.2].forEach(x=>{const b=skClone(M.banner.scene);b.position.set(x,wh*.55,wallZ+.45);b.scale.setScalar(1.2);stage.add(b)})}
  // merge static stage into few draw calls
  stage.updateMatrixWorld(true);const groups=new Map();
  stage.traverse(o=>{if(o.isMesh&&o.geometry&&!o.isSkinnedMesh){const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes)){if(!['position','normal','uv'].includes(k))g.deleteAttribute(k)}const key=o.material.uuid;if(!groups.has(key))groups.set(key,{m:o.material,g:[]});groups.get(key).g.push(g.index?g.toNonIndexed():g)}});
  const merged=new THREE.Group();groups.forEach(v=>{try{const mg=mergeGeometries(v.g,false);if(mg)merged.add(new THREE.Mesh(mg,v.m))}catch(e){v.g.forEach(g=>merged.add(new THREE.Mesh(g,v.m)))}});
  scene.remove(stage);scene.add(merged);
  // blob shadow texture
  const bc=document.createElement("canvas");bc.width=bc.height=64;const bx=bc.getContext("2d");const gr=bx.createRadialGradient(32,32,2,32,32,32);gr.addColorStop(0,"rgba(0,0,0,.65)");gr.addColorStop(1,"rgba(0,0,0,0)");bx.fillStyle=gr;bx.fillRect(0,0,64,64);
  stat.blob=new THREE.CanvasTexture(bc);
  stat.theme=-1;
}
function applyTheme(i){
  if(stat.theme===i)return;stat.theme=i;const t=THEME[i]||THEME[0];
  scene.fog.color.set(t.fog);scene.background=new THREE.Color(t.fog);torches.forEach(l=>l.color.set(t.torch));
  scene.children[0].color.set(t.amb);
}
function blob(w){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:stat.blob,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.02;m.scale.set(w,w*.55,1);return m}
function setupAnim(o,g){
  const mx=new THREE.AnimationMixer(o);const acts={};for(const c of g.animations)acts[c.name]=mx.clipAction(c);return {mx,acts};
}
function pick(acts,re){const k=Object.keys(acts).find(n=>re.test(n));return k?acts[k]:null}
function play(I,re,once){const a=pick(I.acts,re);if(!a)return;a.reset();a.setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,Infinity);a.clampWhenFinished=true;a.setEffectiveWeight(1).play();if(I.cur&&I.cur!==a)I.cur.crossFadeTo(a,.15,false);I.cur=a;if(once){I.busy=true;I.until=I.mx.time+a.getClip().duration}}
function idle(I){const a=I.idleA;if(!a)return;a.reset().setLoop(THREE.LoopRepeat,Infinity).play();if(I.cur&&I.cur!==a)I.cur.crossFadeTo(a,.2,false);I.cur=a;I.busy=false}
function mkChar(modelKey,tint,h){
  const g=M[modelKey]||M.blue;const grp=norm(g,h);
  const inner=grp.userData.inner;
  if(tint)grp.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.color)o.material.color.lerp(new THREE.Color(tint),.5)}});
  const I=setupAnim(grp.children[0],g);I.grp=grp;I.root=new THREE.Group();I.root.add(grp);I.root.add(blob(1.6));
  I.idleA=pick(I.acts,/^idle1?(_action)?$/i)||pick(I.acts,/idle/i)||Object.values(I.acts)[0];idle(I);I.mx.update(.3+Math.random()*1.5);fit(grp);
  scene.add(I.root);return I;
}
// ---- screen -> world
const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),v3=new THREE.Vector3();
function floorAt(px,py,w,h){ray.setFromCamera(new THREE.Vector2(px/w*2-1,-(py/h)*2+1),cam);return ray.ray.intersectPlane(plane,v3)?v3.clone():null}
function pxPerUnit(p,w,h){const a=p.clone().project(cam),b=p.clone().add(new THREE.Vector3(0,1,0)).project(cam);return Math.abs((a.y-b.y)*h/2)}
function placeCam(w,h){cam.aspect=w/h;
  const D=Math.max(19,Math.min(34,w/52));cam.fov=17;cam.position.set(0,3.9,D);cam.lookAt(0,1.2,0);cam.updateProjectionMatrix();cam.updateMatrixWorld(true)}
function layout(first){
  if(!hall)return;const r=hall.getBoundingClientRect();const w=Math.max(10,r.width),h=Math.max(10,r.height);
  if(canvas._w!==w||canvas._h!==h){renderer.setSize(w,h,false);canvas.style.width=w+"px";canvas.style.height=h+"px";canvas._w=w;canvas._h=h;placeCam(w,h)}
  const idx=+(document.body.dataset.floor||0);applyTheme(idx);
  // monsters
  const seen=new Set();let sum=0;
  hall.querySelectorAll(".am").forEach(el=>{
    const id=el.dataset.mid,kind=el.dataset.kind,fig=el.querySelector(".fig");if(!fig)return;seen.add(id);
    const fr=fig.getBoundingClientRect(),px=fr.left+fr.width/2-r.left,py=fr.bottom-r.top-fr.height*.04;
    const p=floorAt(px,py,w,h);if(!p)return;const ppu=pxPerUnit(p,w,h);
    const kd=KIND[kind]||KIND.imp;let I=inst[id];const debt=+el.dataset.debt||0;sum+=debt;
    if(!I){I=inst[id]=mkChar(kd.m,kd.tint,1);I.id=id;I.debt=debt;I.k=0;I.root.position.copy(p)}
    const heightUnits=fr.height*.96/ppu;I.tp=p;I.ts=heightUnits;
    if(first||I.k===0){I.root.position.copy(p);I.root.scale.setScalar(heightUnits);I.k=1}
    if(debt<I.debt-.5){play(I,/hitreact|damage/i,true);I.flash=1}
    else if(debt>I.debt+.5){I.pulse=1}
    I.debt=debt;I.root.rotation.y=-Math.PI/2+.45;
  });
  Object.keys(inst).forEach(id=>{if(!seen.has(id)){const I=inst[id];I.dying=I.dying||1;if(I.dying===1){play(I,/death/i,true);I.dying=2;I.fade=1;I.ts0=I.ts||1;I.tp=null}}});
  // knight
  const kn=hall.querySelector(".kn");
  if(kn){const kr=kn.getBoundingClientRect(),px=kr.left+kr.width/2-r.left,py=kr.bottom-r.top-kr.height*.05;const p=floorAt(px,py,w,h);
    if(p){const ppu=pxPerUnit(p,w,h);if(!knight){knight=mkChar("knight",0,1);knight.root.position.copy(p);knight.k=0}
      knight.tp=p;knight.ts=Math.max(kr.height*1.25,84)/ppu;if(!knight.k){knight.root.position.copy(p);knight.root.scale.setScalar(knight.ts);knight.k=1}
      knight.root.rotation.y=Math.PI/2-.35;
      if(prevSum!==null){const win=!seen.size;
        if(win&&!knight.won){knight.won=true;play(knight,/^cheer/i,true);knight.loopCheer=true}
        else if(!win){knight.won=false;if(sum<prevSum-.5)play(knight,/slice_horizontal|chop/i,true);else if(sum>prevSum+.5)play(knight,/block_hit|hit_a/i,true)}}
      prevSum=sum}}
  // coins
  const st=hall.querySelector(".stash");
  if(st){const n=+(st.dataset.coins||0),sr=st.getBoundingClientRect(),px=sr.left+sr.width/2-r.left,py=sr.bottom-r.top-6;const p=floorAt(px,py,w,h);
    const key=n===0?null:n<=3?"cs":n<=7?"cm":"cl";
    if(!coins||coins.key!==key){if(coins){scene.remove(coins.o);}coins=null;if(key&&M[key]){const o=skClone(M[key].scene);const b=new THREE.Box3().setFromObject(o);o.position.y=-b.min.y;const g=new THREE.Group();g.add(o);g.userData.h=b.max.y-b.min.y;scene.add(g);coins={o:g,key}}}
    if(coins&&p){const ppu=pxPerUnit(p,w,h);coins.o.position.copy(p);const target=Math.max(30,Math.min(56,h*.24))/ppu;coins.o.scale.setScalar(target/coins.o.userData.h)}}
}
const Q={n:0,sum:0,level:0,last:0,skip:false};
function degrade(){
  if(Q.level===0){Q.level=1;Q.n=0;Q.sum=0;renderer.setPixelRatio(.7);canvas._w=0;torches.forEach(l=>{l.visible=false;});return}
  A.fallback()}
A.fallback=function(){A.failed=true;running=false;try{if(hall){hall.classList.remove("hall3");canvas.remove()}}catch(e){}hall=null;try{window.__game&&window.__game.render&&window.__game.render()}catch(e){}};
function frame(now){
  if(!running)return;requestAnimationFrame(frame);
  if(!hall||!hall.isConnected||document.hidden)return;
  if(Q.last&&now-Q.last<30)return;
  const rr=hall.getBoundingClientRect();if(rr.bottom<0||rr.top>innerHeight){Q.last=0;return}
  if(Q.last){const d=now-Q.last;if(d<1000){Q.sum+=d;Q.n++;if(Q.n>=24){const avg=Q.sum/Q.n;Q.n=0;Q.sum=0;if(avg>85&&!/force3d/.test(location.search)){degrade();return}}}}
  Q.last=now;
  const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  torches.forEach(l=>{const s=l.userData.seed;if(l.visible)l.intensity=150+40*Math.sin(t*9+s)+24*Math.sin(t*23+s*2);if(l.userData.glow)l.userData.glow.material.opacity=.75+.25*Math.sin(t*11+s)});
  const all=Object.values(inst).concat(knight?[knight]:[]);
  for(const I of all){
    I.mx.update(dt);
    if(I.busy&&I.mx.time>=I.until-.02){if(I===knight&&knight.loopCheer){/* stay in cheer pose loop */I.busy=false;play(I,/^cheer/i,false)}else idle(I)}
    if(I.tp){const k=1-Math.pow(.0005,dt);I.root.position.lerp(I.tp,k);let s=I.ts*(1+(I.pulse||0)*.22);const cs=I.root.scale.x;I.root.scale.setScalar(cs+(s-cs)*k)}
    if(I.pulse)I.pulse=Math.max(0,I.pulse-dt*1.6);
    if(I.dying===2){I.fade=Math.max(0,I.fade-dt*.7);I.root.scale.setScalar(Math.max(.001,(I.ts0||1)*Math.min(1,I.fade*1.6)));if(I.fade<=0){scene.remove(I.root);delete inst[I.id]}}
  }
  // gentle camera sway
  cam.position.x=Math.sin(t*.35)*.35;cam.lookAt(0,1.2,0);
  renderer.render(scene,cam);
}
A.mount=function(h){
  if(!A.ready||A.failed)return false;
  try{hall=h;h.insertBefore(canvas,h.firstChild);h.classList.add("hall3");canvas._w=0;layout(true);renderer.render(scene,cam);
    if(!running){running=true;clock.start();Q.last=0;requestAnimationFrame(frame)}return true}catch(e){console.warn("Arena3D mount",e);A.failed=true;h.classList.remove("hall3");return false}
};
A._dbg=()=>({renderer,scene,cam,torches});
A.info=()=>({calls:renderer.info.render.calls,tris:renderer.info.render.triangles,geoms:renderer.info.memory.geometries,lights:scene.children.filter(c=>c.isLight).length});
A.resize=()=>{if(hall&&hall.isConnected){canvas._w=0;layout(false)}};
addEventListener("resize",()=>A.resize());
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{try{load()}catch(e){A.failed=true}});else{try{load()}catch(e){A.failed=true}}
