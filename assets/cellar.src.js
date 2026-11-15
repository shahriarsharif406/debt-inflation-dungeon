// Procedural "realistic" wine-cellar environment: masonry, flagstone floor, arches, wine racks,
// oak barrels, iron sconces, light pools, dust. All textures are generated at runtime (no external files).
import * as THREE from 'three';

function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function mkNoise(seed,N){const r=rng(seed),g=new Float32Array(N*N);for(let i=0;i<g.length;i++)g[i]=r();
  const s=t=>t*t*(3-2*t);
  const n1=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=s(x-xi),yf=s(y-yi);const a=g[((yi%N+N)%N)*N+((xi%N+N)%N)],b=g[((yi%N+N)%N)*N+(((xi+1)%N+N)%N)],c=g[(((yi+1)%N+N)%N)*N+((xi%N+N)%N)],d=g[(((yi+1)%N+N)%N)*N+(((xi+1)%N+N)%N)];return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf};
  return(x,y)=>(n1(x,y)*.55+n1(x*2.1,y*2.1)*.3+n1(x*4.3,y*4.3)*.15)}

// height-field -> tangent-space normal map
function normalFrom(H,W,Ht,k){const d=new Uint8ClampedArray(W*Ht*4);
  for(let y=0;y<Ht;y++)for(let x=0;x<W;x++){
    const l=H[y*W+(x+W-1)%W],r=H[y*W+(x+1)%W],u=H[((y+Ht-1)%Ht)*W+x],dn=H[((y+1)%Ht)*W+x];
    let nx=(l-r)*k,ny=(dn-u)*k,nz=1;const L=Math.hypot(nx,ny,nz);nx/=L;ny/=L;nz/=L;
    const o=(y*W+x)*4;d[o]=(nx*.5+.5)*255;d[o+1]=(ny*.5+.5)*255;d[o+2]=(nz*.5+.5)*255;d[o+3]=255}
  return d}
function toTex(data,W,Ht,srgb){const c=document.createElement('canvas');c.width=W;c.height=Ht;c.getContext('2d').putImageData(new ImageData(data,W,Ht),0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}

// masonry / flagstone generator: running-bond blocks with bevel, chips, damp stains
function masonry(o){
  const W=o.W,Ht=o.H,rnd=rng(o.seed),nz=mkNoise(o.seed+7,32),nz2=mkNoise(o.seed+99,32);
  const col=new Uint8ClampedArray(W*Ht*4),hgt=new Float32Array(W*Ht),rgh=new Uint8ClampedArray(W*Ht*4);
  const rowH=Ht/o.rows;
  for(let r=0;r<o.rows;r++){
    let x=-Math.floor(rnd()*o.bw[1]);const y0=Math.round(r*rowH),y1=Math.round((r+1)*rowH);
    const jitterRow=(rnd()-.5)*o.rowJit;
    while(x<W){
      const bw=Math.round(o.bw[0]+rnd()*(o.bw[1]-o.bw[0]));const pal=o.pal[Math.floor(rnd()*o.pal.length)];
      const tone=.82+rnd()*.34,warm=(rnd()-.5)*.1,hOff=(rnd()-.5)*.12;
      const mort=o.mortar*(.8+rnd()*.5);
      for(let py=y0;py<y1;py++)for(let px=x;px<x+bw;px++){
        const X=((px%W)+W)%W,Y=py%Ht;const dx=Math.min(px-x,x+bw-1-px),dy=Math.min(py-y0,y1-1-py);const d=Math.min(dx,dy);
        const n=nz(X/38,Y/38),n2=nz2(X/9,Y/9),n3=nz(X/150+3,Y/150+5);
        let hh,rr,gg,bb,ro;
        if(d<mort){hh=0;const m=.55+n2*.35;rr=pal[0]*.12*m;gg=pal[1]*.12*m;bb=pal[2]*.12*m;ro=250}
        else{const b=Math.min(1,(d-mort)/o.bevel);const bs=b*b*(3-2*b);
          hh=.42+.5*bs+hOff+(n-.5)*.34+(n2-.5)*.1;
          const sh=.74+.4*bs;let t=tone*sh*(.82+n*.42)*(.94+n2*.12);
          // damp / grime towards the bottom of the tile and low-frequency stains
          const stain=Math.max(0,n3-.45)*1.7;t*=1-stain*.62;
          rr=pal[0]*t*(1+warm);gg=pal[1]*t;bb=pal[2]*t*(1-warm);
          if(o.moss&&n3>.6&&n>.5){const m=Math.min(1,(n3-.6)*4);rr*=1-.25*m;gg*=1+.05*m;bb*=1-.3*m}
          ro=185+n2*60}
        const i=(Y*W+X)*4;col[i]=rr;col[i+1]=gg;col[i+2]=bb;col[i+3]=255;hgt[Y*W+X]=hh;rgh[i]=rgh[i+1]=rgh[i+2]=ro;rgh[i+3]=255}
      x+=bw}
  }
  // chips & pits
  for(let k=0;k<o.chips;k++){const cx=Math.floor(rnd()*W),cy=Math.floor(rnd()*Ht),cr=2+Math.floor(rnd()*5);
    for(let y=-cr;y<=cr;y++)for(let x=-cr;x<=cr;x++){const dd=Math.hypot(x,y);if(dd<cr){const X=(cx+x+W)%W,Y=(cy+y+Ht)%Ht;hgt[Y*W+X]-= (1-dd/cr)*.35;const i=(Y*W+X)*4;col[i]*=.8;col[i+1]*=.8;col[i+2]*=.8}}}
  for(let k=0;k<(o.cracks||0);k++){let cx=rnd()*W,cy=rnd()*Ht,a=rnd()*6.28;const len=40+rnd()*110;for(let i=0;i<len;i++){a+=(rnd()-.5)*.5;cx+=Math.cos(a)*1.4;cy+=Math.sin(a)*1.4;const X=((Math.floor(cx)%W)+W)%W,Y=((Math.floor(cy)%Ht)+Ht)%Ht;
    for(let q=0;q<2;q++){const XX=(X+q)%W,idx=Y*W+XX;hgt[idx]-=.45;const ci=idx*4;col[ci]*=.45;col[ci+1]*=.45;col[ci+2]*=.45}}}
  const nrm=normalFrom(hgt,W,Ht,o.relief);
  return{map:toTex(col,W,Ht,true),normal:toTex(nrm,W,Ht,false),rough:toTex(rgh,W,Ht,false)}}

function woodTex(seed,W,Ht,base){
  const rnd=rng(seed),nz=mkNoise(seed+3,32);const col=new Uint8ClampedArray(W*Ht*4),hgt=new Float32Array(W*Ht);const ns=7;
  for(let s=0;s<ns;s++){const x0=Math.round(s*W/ns),x1=Math.round((s+1)*W/ns);const tone=.8+rnd()*.35;
    for(let y=0;y<Ht;y++)for(let x=x0;x<x1;x++){const dx=Math.min(x-x0,x1-1-x);
      const grain=nz(x*.9+s*13,y/55);const ring=.5+.5*Math.sin((x-x0)*.35+grain*9);
      const t=tone*(.72+.34*grain+.14*ring);let hh=dx<2?0:.55+.2*grain+.15*ring;if(dx<2)hh=0;
      const i=(y*W+x)*4;const k=dx<2?.35:1;col[i]=base[0]*t*k;col[i+1]=base[1]*t*k;col[i+2]=base[2]*t*k;col[i+3]=255;hgt[y*W+x]=hh}}
  return{map:toTex(col,W,Ht,true),normal:toTex(normalFrom(hgt,W,Ht,2.2),W,Ht,false)}}

function glowTex(stops,size){const c=document.createElement('canvas');c.width=c.height=size||128;const x=c.getContext('2d');const h=c.width/2;const g=x.createRadialGradient(h,h,1,h,h,h);stops.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,c.width,c.width);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}

function webTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.strokeStyle='rgba(235,235,240,.75)';x.lineWidth=1.1;
  const rr=rng(5);for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;x.beginPath();x.moveTo(0,0);x.lineTo(Math.cos(a)*126,Math.sin(a)*126);x.stroke()}
  for(let r=18;r<125;r+=17){x.beginPath();for(let i=0;i<=6;i++){const a=i/6*Math.PI/2;const rad=r*(.88+rr()*.2);const px=Math.cos(a)*rad,py=Math.sin(a)*rad;if(i===0)x.moveTo(px,py);else x.quadraticCurveTo(Math.cos(a-.13)*rad*.86,Math.sin(a-.13)*rad*.86,px,py)}x.stroke()}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}

export function buildCellar(stage,scene,opt){
  const wallZ=opt.wallZ,torches=opt.torches;const ctl={mats:[],tick:null};
  const stonePal=[[98,95,92],[86,85,86],[106,98,90],[78,79,84],[94,88,80]];
  const wallT=masonry({W:1024,H:512,rows:11,bw:[70,170],mortar:3,bevel:5,pal:stonePal,seed:11,rowJit:0,relief:3.4,chips:620,cracks:26,moss:true});
  const floorT=masonry({W:1024,H:1024,rows:9,bw:[110,240],mortar:5,bevel:8,pal:[[78,75,72],[70,69,70],[86,80,74],[62,62,66]],seed:23,rowJit:0,relief:2.6,chips:700,cracks:20,moss:false});
  const woodA=woodTex(41,256,256,[150,100,58]);const woodB=woodTex(57,256,256,[96,64,38]);
  const tex=(t,rx,ry)=>{const m=t.map.clone(),n=t.normal.clone(),r=t.rough&&t.rough.clone();[m,n,r].forEach(q=>{if(q){q.repeat.set(rx,ry);q.needsUpdate=true}});return{m,n,r}};
  const stoneMat=(rx,ry,tint)=>{const q=tex(wallT,rx,ry);const m=new THREE.MeshStandardMaterial({map:q.m,normalMap:q.n,roughnessMap:q.r,roughness:1,metalness:0,normalScale:new THREE.Vector2(1.1,1.1),color:tint||0xffffff});ctl.mats.push(m);return m};
  // ---- back wall + base plinth + cornice
  const W=70,wallH=18;
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(W,wallH),stoneMat(W/16,wallH/8));wall.position.set(0,wallH/2,wallZ);stage.add(wall);
  const plinth=new THREE.Mesh(new THREE.BoxGeometry(W,.7,.5),stoneMat(W/16,.7/8,0xb8b0a8));plinth.position.set(0,.35,wallZ+.22);stage.add(plinth);
  const cornY=7.6;const corn=new THREE.Mesh(new THREE.BoxGeometry(W,.55,.85),stoneMat(W/16,.55/8,0xcfc6bb));corn.position.set(0,cornY,wallZ+.4);stage.add(corn);
  const cornTop=new THREE.Mesh(new THREE.BoxGeometry(W,6,.5),new THREE.MeshStandardMaterial({color:0x15110f,roughness:1}));cornTop.position.set(0,cornY+3.3,wallZ+.3);stage.add(cornTop);
  // oak ceiling beams
  const bmat=(()=>{const q=tex(woodB,2,1);return new THREE.MeshStandardMaterial({map:q.m,normalMap:q.n,roughness:.85,color:0xb09070})})();
  [-12,0,12].forEach(x=>{const b=new THREE.Mesh(new THREE.BoxGeometry(1,1.0,2.4),bmat);b.position.set(x,cornY-.7,wallZ+1.2);stage.add(b)});
  // ---- floor
  const fq=tex(floorT,90/12,40/12);
  const floorM=new THREE.MeshStandardMaterial({map:fq.m,normalMap:fq.n,roughnessMap:fq.r,roughness:1,metalness:0,normalScale:new THREE.Vector2(.9,.9)});ctl.mats.push(floorM);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,40),floorM);floor.rotation.x=-Math.PI/2;floor.position.set(0,0,wallZ+20);stage.add(floor);
  // ---- piers
  const pierX=[-15.5,-5.2,5.2,15.5];
  const pierM=stoneMat(1.2/16,8/8,0xd8d0c6),padM=stoneMat(1.8/16,.7/8,0xc8c0b6);
  pierX.forEach(x=>{
    const p=new THREE.Mesh(new THREE.BoxGeometry(1.25,cornY,1.1),pierM);p.position.set(x,cornY/2,wallZ+.5);stage.add(p);
    const b=new THREE.Mesh(new THREE.BoxGeometry(1.7,.7,1.5),padM);b.position.set(x,.35,wallZ+.62);stage.add(b);
    const c=new THREE.Mesh(new THREE.BoxGeometry(1.7,.5,1.5),padM);c.position.set(x,cornY-.5,wallZ+.62);stage.add(c)});
  // ---- arched wine alcoves
  const bottleGeo=new THREE.CylinderGeometry(.19,.19,.55,16);bottleGeo.rotateX(Math.PI/2);
  const glassM=[0xa88c5c,0x967a4c,0xb89c68,0x8c7348].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0,emissive:0x1a1004,emissiveIntensity:.15}));
  const rackWood=(()=>{const q=tex(woodB,1.2,1.2);return new THREE.MeshStandardMaterial({map:q.m,normalMap:q.n,roughness:.8,color:0xa07c58})})();
  const backM=new THREE.MeshStandardMaterial({color:0x120c08,roughness:1});
  const alT=glowTex([[0,'rgba(255,190,110,.55)'],[.45,'rgba(255,150,60,.22)'],[1,'rgba(255,120,30,0)']],128);
  const coreGeo=new THREE.CylinderGeometry(.075,.075,.58,10);coreGeo.rotateX(Math.PI/2);const coreM=new THREE.MeshStandardMaterial({color:0x3a2a16,roughness:1});const n0=c=>c.reduce((a,b)=>a+b,0);
  function alcove(cx,half,hs){
    const ag=new THREE.Sprite(new THREE.SpriteMaterial({map:alT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false,opacity:.3}));ag.scale.set(half*3.2,half*3.2,1);ag.position.set(cx,hs*.8,wallZ+.85);ag.renderOrder=3;scene.add(ag);
    const t=.42,R=half+t;
    const sh=new THREE.Shape();sh.moveTo(-R,0);sh.lineTo(-R,hs);sh.absarc(0,hs,R,Math.PI,0,true);sh.lineTo(R,0);sh.lineTo(-R,0);
    const hole=new THREE.Path();hole.moveTo(-half,0);hole.lineTo(-half,hs);hole.absarc(0,hs,half,Math.PI,0,true);hole.lineTo(half,0);hole.lineTo(-half,0);sh.holes.push(hole);
    const g=new THREE.ExtrudeGeometry(sh,{depth:.6,bevelEnabled:false,curveSegments:18});
    const ring=new THREE.Mesh(g,stoneMat(1/16,1/8,0xe0d8cc));ring.position.set(cx,0,wallZ+.02);stage.add(ring);
    // keystone
    const ks=new THREE.Mesh(new THREE.BoxGeometry(.5,.62,.7),stoneMat(.5/16,.62/8,0xefe6d8));ks.position.set(cx,hs+R-.28,wallZ+.35);stage.add(ks);
    // recessed back panel
    const bp=new THREE.Mesh(new THREE.ShapeGeometry((()=>{const s=new THREE.Shape();s.moveTo(-half,0);s.lineTo(-half,hs);s.absarc(0,hs,half,Math.PI,0,true);s.lineTo(half,0);s.lineTo(-half,0);return s})(),18),backM);bp.position.set(cx,0,wallZ+.06);stage.add(bp);
    // shelves of ledger books standing upright
    const rows=Math.floor((hs+half*.55)/.5);
    const bookGeo=new THREE.BoxGeometry(1,1,1);
    const bookM=new THREE.MeshStandardMaterial({roughness:.7,metalness:.05,color:0xffffff});
    const cap=Math.ceil(rows*Math.ceil(half*2/.07));
    const books=new THREE.InstancedMesh(bookGeo,bookM,cap);const dm=new THREE.Object3D();
    const cols=[0x4a1f1c,0x2f3b2a,0x23304a,0x5a4326,0x3a2420,0x2a2a38,0x4c3a22,0x1f3a3a];const br=rng(31+Math.round(cx*3));let bn=0;
    for(let r=0;r<rows;r++){const y0=.285+r*.5;let x=-half+.14;
      while(x<half-.14&&bn<cap-1){
        if(br()<.07){x+=.1+br()*.18;continue}
        const w=.07+br()*.09,h=.3+br()*.12,d=.3+br()*.04,xc=x+w/2,yc=y0+h/2;
        if(y0+h>hs&&Math.hypot(xc,y0+h-hs)>half-.1)break;
        dm.position.set(cx+xc,yc,wallZ+.34);dm.rotation.set(0,0,br()<.08?(br()-.5)*.25:0);dm.scale.set(w,h,d);dm.updateMatrix();books.setMatrixAt(bn,dm.matrix);
        const cc=new THREE.Color(cols[Math.floor(br()*cols.length)]);cc.multiplyScalar(.75+br()*.5);books.setColorAt(bn,cc);bn++;x+=w+.008}}
    books.count=bn;books.instanceMatrix.needsUpdate=true;if(books.instanceColor)books.instanceColor.needsUpdate=true;scene.add(books);
    const n=bn;
    // slats
    for(let r=0;r<=rows;r++){const y=.25+r*.5;if(y>hs+half-.5)break;const wlen=y>hs?2*Math.sqrt(Math.max(.01,half*half-(y-hs)*(y-hs))):half*2;
      const s=new THREE.Mesh(new THREE.BoxGeometry(wlen,.07,.5),rackWood);s.position.set(cx,y,wallZ+.3);stage.add(s)}
    [-half+.05,0,half-.05].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(.08,hs,.5),rackWood);s.position.set(cx+x,hs/2,wallZ+.3);stage.add(s)});
    return n}
  alcove(-10.3,1.85,3.3);alcove(0,1.85,3.3);alcove(10.3,1.85,3.3);
  // ---- grain sacks, clay storage jars, crates
  const sackM=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#b8996a';x.fillRect(0,0,128,128);const r=rng(9);for(let i=0;i<900;i++){x.fillStyle=`rgba(${r()<.5?'90,66,36':'214,188,140'},${.12+r()*.18})`;x.fillRect(r()*128,r()*128,r()<.5?1:12,r()<.5?12:1)}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return new THREE.MeshStandardMaterial({map:t,roughness:1,color:0xb8a888})})();
  const ropeM=new THREE.MeshStandardMaterial({color:0x5a4228,roughness:1});
  const sackGeo=new THREE.SphereGeometry(.62,20,16);
  function sack(x,y,z,s,ry,lean){const g=new THREE.Group();const b=new THREE.Mesh(sackGeo,sackM);b.scale.set(1,1.15,.78);b.position.y=.68;g.add(b);
    const nk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.3,.34,12),sackM);nk.position.y=1.38;g.add(nk);
    const tp=new THREE.Mesh(new THREE.ConeGeometry(.26,.28,12),sackM);tp.position.y=1.66;tp.rotation.z=.2;g.add(tp);
    const rp=new THREE.Mesh(new THREE.TorusGeometry(.24,.04,6,14),ropeM);rp.rotation.x=Math.PI/2;rp.position.y=1.28;g.add(rp);
    g.position.set(x,y,z);g.rotation.y=ry||0;g.rotation.z=lean||0;g.scale.setScalar(s||1);stage.add(g)}
  const clayM=new THREE.MeshStandardMaterial({color:0x6e4430,roughness:.85,metalness:0});
  const clayDark=new THREE.MeshStandardMaterial({color:0x5a2e1e,roughness:.9});
  const jarProf=[[.0,0],[.34,0],[.5,.2],[.62,.55],[.56,.95],[.34,1.2],[.26,1.38],[.34,1.5],[.3,1.55]].map(p=>new THREE.Vector2(p[0],p[1]));
  const jarGeo=new THREE.LatheGeometry(jarProf,22);
  function jar(x,z,s,ry){const g=new THREE.Group();g.add(new THREE.Mesh(jarGeo,clayM));const bd=new THREE.Mesh(new THREE.CylinderGeometry(.585,.585,.06,22,1,true),clayDark);bd.position.y=.6;g.add(bd);
    g.position.set(x,0,z);g.rotation.y=ry||0;g.scale.setScalar(s||1);stage.add(g)}
  const crateM=(()=>{const q=tex(woodA,1,1);return new THREE.MeshStandardMaterial({map:q.m,normalMap:q.n,roughness:.8,color:0xa07848})})();
  const strapM=new THREE.MeshStandardMaterial({color:0x35302c,metalness:.6,roughness:.5});
  function crate(x,y,z,s,ry){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.2,1.5),crateM);b.position.y=.6;g.add(b);
    [[-.7,0],[.7,0]].forEach(([dx])=>{const st=new THREE.Mesh(new THREE.BoxGeometry(.12,1.24,1.54),strapM);st.position.set(dx,.6,0);g.add(st)});
    g.position.set(x,y,z);g.rotation.y=ry||0;g.scale.setScalar(s||1);stage.add(g)}
  const zb=wallZ+2.6;
  sack(-13.2,0,zb+.2,1.0,.3);sack(-11.9,0,zb+.9,.9,1.1,.05);sack(-12.5,.95,zb+.35,.8,.6,-.1);jar(-10.6,zb+1.4,.9,0);crate(-13.8,0,zb+2.2,.85,.4);
  sack(12.6,0,zb+.1,1.05,2.0);sack(11.2,0,zb+1.0,.9,.7,-.05);jar(14.2,zb+1.1,1.0,0);jar(13.2,zb+2.2,.8,0);crate(8.6,0,zb+.3,.85,-.3);crate(8.6,1.02,zb+.3,.62,.2);
  jar(-7.9,zb+.5,.85,0);
  // contact shadows under props
  const shadowT=glowTex([[0,'rgba(0,0,0,.7)'],[.6,'rgba(0,0,0,.35)'],[1,'rgba(0,0,0,0)']],64);
  [[-12.9,zb+.5,3],[-10.6,zb+1.4,1.6],[-13.8,zb+2.2,2.2],[12,zb+.5,3],[14.2,zb+1.1,1.8],[13.2,zb+2.2,1.5],[8.6,zb+.3,2.2],[-7.9,zb+.5,1.6]].forEach(([x,z,s])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s*.8),new THREE.MeshBasicMaterial({map:shadowT,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.025,z);m.renderOrder=1;scene.add(m)});
  // wall base AO + vignette bands
  const aoT=(()=>{const c=document.createElement('canvas');c.width=4;c.height=64;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,4,64);return new THREE.CanvasTexture(c)})();
  const ao=new THREE.Mesh(new THREE.PlaneGeometry(W,3.2),new THREE.MeshBasicMaterial({map:aoT,transparent:true,depthWrite:false}));ao.rotation.x=-Math.PI/2;ao.position.set(0,.03,wallZ+1.6);ao.renderOrder=1;scene.add(ao);
  // ---- sconces + torches (lights stay in `torches`, same contract as before)
  const ironM=new THREE.MeshStandardMaterial({color:0x2c2a28,metalness:.7,roughness:.5});
  const flameT=glowTex([[0,'rgba(255,240,190,1)'],[.18,'rgba(255,190,90,.95)'],[.45,'rgba(255,120,30,.5)'],[1,'rgba(255,80,10,0)']],96);
  const haloT=glowTex([[0,'rgba(255,170,80,.55)'],[.4,'rgba(255,120,40,.18)'],[1,'rgba(255,90,20,0)']],128);
  const poolT=glowTex([[0,'rgba(255,170,90,.55)'],[.35,'rgba(255,130,50,.26)'],[1,'rgba(255,100,30,0)']],128);
  pierX.forEach((x,i)=>{
    const fz=wallZ+1.12;const y=3.4;
    const plate=new THREE.Mesh(new THREE.BoxGeometry(.16,.7,.08),ironM);plate.position.set(x,y-.15,fz+.04);stage.add(plate);
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.42),ironM);arm.position.set(x,y-.38,fz+.24);stage.add(arm);
    const cup=new THREE.Mesh(new THREE.CylinderGeometry(.16,.1,.22,10),ironM);cup.position.set(x,y-.2,fz+.42);stage.add(cup);
    const wood=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,.55,8),new THREE.MeshStandardMaterial({color:0x3a2616,roughness:1}));wood.position.set(x,y+.12,fz+.42);stage.add(wood);
    const L=new THREE.PointLight(0xffa24d,60,26,1.6);L.position.set(x,y+.9,fz+1.5);L.userData.seed=Math.random()*9;
    const lit=i===1||i===2;if(lit)scene.add(L);else{L.intensity=0;L.visible=false}torches.push(L);
    const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:flameT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));fl.scale.set(.62,.95,1);fl.position.set(x,y+.62,fz+.45);scene.add(fl);
    const hl=new THREE.Sprite(new THREE.SpriteMaterial({map:haloT,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false}));hl.scale.set(3.2,3.2,1);hl.position.set(x,y+.66,fz+.6);scene.add(hl);
    L.userData.glow=fl;L.userData.halo=hl;
    // light pools on wall & floor
    const pw=new THREE.Mesh(new THREE.PlaneGeometry(8.5,8.5),new THREE.MeshBasicMaterial({map:poolT,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:lit?.85:.4}));pw.position.set(x,y+.3,wallZ+.03);pw.renderOrder=2;scene.add(pw);
    const pf=new THREE.Mesh(new THREE.PlaneGeometry(9,5),new THREE.MeshBasicMaterial({map:poolT,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:lit?.5:.22}));pf.rotation.x=-Math.PI/2;pf.position.set(x,.04,wallZ+3.6);pf.renderOrder=2;scene.add(pf);
    pw.userData.p=pf.userData.p=L;ctl.mats.pools=(ctl.mats.pools||[]).concat([pw,pf])});
  // cobwebs high in the corners
  const wt=webTex();[[-14.7,cornY-.6,1],[14.7,cornY-.6,-1],[-4.55,cornY-.6,1],[4.55,cornY-.6,-1]].forEach(([x,y,s])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),new THREE.MeshBasicMaterial({map:wt,transparent:true,depthWrite:false,opacity:.55}));m.scale.x=s;m.position.set(x+s*.8,y-.75,wallZ+1.3);m.rotation.z=0;m.renderOrder=3;scene.add(m)});
  // light shaft + dust motes
  const shaftT=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(255,236,200,.0)');g.addColorStop(.15,'rgba(255,236,200,.5)');g.addColorStop(1,'rgba(255,236,200,0)');x.fillStyle=g;x.fillRect(0,0,64,256);x.globalCompositeOperation='destination-in';const h=x.createLinearGradient(0,0,64,0);h.addColorStop(0,'rgba(0,0,0,0)');h.addColorStop(.5,'rgba(0,0,0,1)');h.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=h;x.fillRect(0,0,64,256);return new THREE.CanvasTexture(c)})();
  const shaft=new THREE.Mesh(new THREE.PlaneGeometry(3.6,11),new THREE.MeshBasicMaterial({map:shaftT,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.2,fog:false}));shaft.position.set(-1.6,4.4,wallZ+1.6);shaft.rotation.z=-.24;shaft.renderOrder=2;scene.add(shaft);
  const N=90,pos=new Float32Array(N*3),sp=[];const r=rng(77);for(let i=0;i<N;i++){pos[i*3]=-16+r()*32;pos[i*3+1]=.4+r()*7;pos[i*3+2]=wallZ+1+r()*9;sp.push([.05+r()*.12,r()*6.28,.2+r()*.5])}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const dust=new THREE.Points(pg,new THREE.PointsMaterial({map:glowTex([[0,'rgba(255,240,210,1)'],[.4,'rgba(255,230,190,.4)'],[1,'rgba(255,220,180,0)']],32),size:.16,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true,fog:false}));dust.frustumCulled=false;scene.add(dust);
  ctl.tick=(t,dt)=>{const p=pg.attributes.position.array;for(let i=0;i<N;i++){const s=sp[i];p[i*3+1]+=s[0]*dt;p[i*3]+=Math.sin(t*.4+s[1])*dt*.12;if(p[i*3+1]>7.4)p[i*3+1]=.4}pg.attributes.position.needsUpdate=true};
  return ctl}

export function cashStack(key){
  const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,128,64);g.addColorStop(0,'#5f9a62');g.addColorStop(1,'#3f7a4c');x.fillStyle=g;x.fillRect(0,0,128,64);
  x.strokeStyle='#d9ecc9';x.lineWidth=3;x.strokeRect(5,5,118,54);x.lineWidth=1.5;x.strokeRect(11,11,106,42);
  x.fillStyle='#d9ecc9';x.beginPath();x.arc(64,32,15,0,6.3);x.fill();x.fillStyle='#2f6a40';x.font='bold 22px system-ui,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText('$',64,33);
  x.fillStyle='#d9ecc9';x.font='bold 13px system-ui,Arial';x.fillText('100',24,32);x.fillText('100',104,32);
  const top=new THREE.CanvasTexture(c);top.colorSpace=THREE.SRGBColorSpace;top.anisotropy=4;
  const side=new THREE.MeshStandardMaterial({color:0x56664a,roughness:.95});
  const topM=new THREE.MeshStandardMaterial({map:top,roughness:.8,color:0x5f8463});
  const mats=[side,side,topM,side,side,side];
  const band=new THREE.MeshStandardMaterial({color:0x6e6246,roughness:.9});
  const layers=key==='cs'?[2,1]:key==='cm'?[3,2,1]:[4,3,2,1];const bh=.3,bw=1.0,bd=.5;
  const grp=new THREE.Group();let n=0;
  layers.forEach((cnt,li)=>{for(let i=0;i<cnt;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),mats);
    b.position.set((i-(cnt-1)/2)*(bw+.05),li*bh+bh/2,((n*37)%7-3)*.02);b.rotation.y=((n*53)%9-4)*.018;grp.add(b);
    const bn=new THREE.Mesh(new THREE.BoxGeometry(.14,bh+.01,bd+.01),band);bn.position.copy(b.position);bn.rotation.copy(b.rotation);grp.add(bn);n++}});
  const o=new THREE.Group();o.add(grp);o.userData.h=layers.length*bh;return o}
