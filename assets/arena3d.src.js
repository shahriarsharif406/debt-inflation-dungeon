import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {buildCellar,cashStack} from './cellar.js';
import {clone as skClone} from 'three/examples/jsm/utils/SkeletonUtils.js';

const BASE=(document.currentScript&&document.currentScript.src)?document.currentScript.src.replace(/[^/]*$/,""):"assets/";
const A={ready:false,failed:false,onready:null};
window.Arena3D=A;
const M={};let cellar=null,renderer,scene,cam,canvas,hall=null,clock,torches=[],running=false,lastTime=0;
const inst={},stat={};let knight=null,coins=null,prevSum=null,floorTheme=0;
const THEME=[{fog:0x161b30,amb:0x7482b0,torch:0xffa24d,tint:0x8fa0d8},{fog:0x2a1a10,amb:0x9a7a60,torch:0xff9438,tint:0xd8a070},{fog:0x2a1018,amb:0x906070,torch:0xff6a3a,tint:0xd87080}];
const KIND={wyrm:{m:"demon"},golem:{m:"orc"},imp:{m:"blue"},vamp:{m:"creep"},hydra:{m:"blue",tint:0x3ddc84},emerg:{m:"demon",tint:0xff8a3d}};
const FILES={knight:"knight.glb",demon:"demon.glb",blue:"bluedemon.glb",orc:"orc.glb",creep:"creep.glb"};
const ESSENTIAL=["knight","demon","blue","orc"];

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
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,innerWidth<700?1.25:1.6));
  scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x161b30,.028);
  cam=new THREE.PerspectiveCamera(17,4.4,.5,120);
  clock=new THREE.Clock();
  // lights
  scene.add(new THREE.HemisphereLight(0xaab6e0,0x4a3a30,.8));
  const key=new THREE.DirectionalLight(0xfff0d0,2.1);key.position.set(-6,9,10);scene.add(key);
  const rim=new THREE.DirectionalLight(0x9fc0ff,1.3);rim.position.set(8,5,-6);scene.add(rim);
  const stage=new THREE.Group();scene.add(stage);
  cellar=buildCellar(stage,scene,{wallZ:-7.2,torches});
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
  if(cellar&&cellar.setFloor)cellar.setFloor(i);
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
  grp.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.color){if(tint)o.material.color.lerp(new THREE.Color(tint),.5);o.material.color.multiplyScalar(modelKey==='knight'?.92:.8)}}});
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
  if(canvas._w!==w||canvas._h!==h){renderer.setSize(w,h,false);canvas.style.width="100%";canvas.style.height="100%";canvas._w=w;canvas._h=h;placeCam(w,h)}
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
    if(!coins||coins.key!==key){if(coins){scene.remove(coins.o);}coins=null;if(key){const g=cashStack(key);scene.add(g);coins={o:g,key}}}
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
  torches.forEach(l=>{const s=l.userData.seed;if(l.visible)l.intensity=A.rm?150:150+40*Math.sin(t*9+s)+24*Math.sin(t*23+s*2);if(l.userData.glow)l.userData.glow.material.opacity=A.rm?.9:.75+.25*Math.sin(t*11+s)});
  const all=Object.values(inst).concat(knight?[knight]:[]);
  for(const I of all){
    I.mx.update(dt);
    if(I.busy&&I.mx.time>=I.until-.02){if(I===knight&&knight.loopCheer){/* stay in cheer pose loop */I.busy=false;play(I,/^cheer/i,false)}else idle(I)}
    if(I.tp){const k=1-Math.pow(.0005,dt);I.root.position.lerp(I.tp,k);let s=I.ts*(1+(I.pulse||0)*.22);const cs=I.root.scale.x;I.root.scale.setScalar(cs+(s-cs)*k)}
    if(I.pulse)I.pulse=Math.max(0,I.pulse-dt*1.6);
    if(I.dying===2){I.fade=Math.max(0,I.fade-dt*.7);I.root.scale.setScalar(Math.max(.001,(I.ts0||1)*Math.min(1,I.fade*1.6)));if(I.fade<=0){scene.remove(I.root);delete inst[I.id]}}
  }
  if(cellar&&cellar.tick&&!A.rm)cellar.tick(t,dt);
  // gentle camera sway
  cam.position.x=A.rm?0:Math.sin(t*.35)*.35;cam.lookAt(0,1.2,0);
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
