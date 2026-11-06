const {JSDOM,VirtualConsole}=require("jsdom");
const fs=require("fs");
const html=fs.readFileSync(require("path").join(__dirname,"..","index.html"),"utf8");
const errors=[];
function boot(){
  const vc=new VirtualConsole();
  vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))errors.push("jsdomError "+e.message)});
  return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.matchMedia=q=>({matches:/reduce/.test(q),addEventListener(){},removeEventListener(){}});w.addEventListener("error",e=>errors.push("ERR "+e.message));
      w.console.error=(...a)=>errors.push("console.error "+a.join(" "))}});
}
const click=(w,el)=>el.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
{
  const dom=boot(),w=dom.window,d=w.document;
  console.log("tier buttons:",d.querySelectorAll(".tier").length,"mode buttons:",d.querySelectorAll("[data-mode]").length);
  click(w,d.querySelector('[data-tier="high"]'));
  console.log("closed:",!d.querySelector("#ov").classList.contains("on"),"tier:",w.__game.S.tier,"cash:",w.__game.S.cash,"monsters:",d.querySelectorAll(".mon").length);
  click(w,d.querySelector("#help"));console.log("help opens:",d.querySelector("#ov2").classList.contains("on"));
}
const SHARED=boot();
function play(tier,strategy,mode,seed){
  const dom=SHARED,w=dom.window,d=w.document,G=w.__game;
  G.newGame(tier,mode||"free");if(seed!==undefined)G.seed(seed);G.render();
  let guard=0;
  while(!G.S.over&&guard++<40){strategy(G);G.endMonth();const c=d.querySelector("#cont");if(c)click(w,c);G.S.busy=false}
  const S=G.S,debt=S.mons.reduce((a,m)=>a+m.debt,0);
  const nw=S.cash+S.assets.vault+S.assets.index+S.assets.dragon-debt;
  return {over:S.over,month:S.month,debt,nw,done:S.done,stars:G.starsFor(S.done),st:{...S.stats},hist:S.hist.length};
}
const avalanche=G=>{let s=0;while(G.S.cash>0&&G.S.mons.length&&s++<80){const m=G.S.mons.slice().sort((a,b)=>b.rate-a.rate)[0];G.pay(m.id,true);G.S.busy=false}};
const S={
  idle:()=>{},
  avalanche,
  "avalanche+skip":G=>{if(G.S.temp)G.skipTemp();avalanche(G)},
  "keeps up (card)":G=>{if(G.S.temp)G.buyTemp(true);avalanche(G)},
  "keeps up (cash)":G=>{if(G.S.temp){G.S.cash>=G.S.temp.cost?G.buyTemp(false):G.buyTemp(true)}avalanche(G)},
  allDragon:G=>{let s=0;while(G.S.cash>=G.S.salary&&s++<30)G.invest("dragon")}
};
const doom={low:3300,mid:5500,high:13200};
for(const tier of (process.argv[2]?[process.argv[2]]:["low","mid","high"])){
  console.log("\n== "+tier.toUpperCase()+" ==");
  for(const [n,st] of Object.entries(S)){
    const N=n==="idle"?8:30;let surv=0,free=0,s3=0,nws=[],bought=0;
    for(let i=0;i<N;i++){const r=play(tier,st);
      if(!r.over)errors.push(tier+" "+n+" unfinished");
      if(r.done)surv++;if(r.debt===0&&r.done)free++;if(r.stars===3)s3++;nws.push(r.nw);bought+=r.st.bought;
      if(r.hist<2)errors.push("hist missing")}
    nws.sort((a,b)=>a-b);
    console.log(`${n.padEnd(17)} survived ${String(surv).padStart(2)}/${N}  debt-free ${String(free).padStart(2)}/${N}  3★ ${String(s3).padStart(2)}  median nw ${String(nws[N>>1]).padStart(6)}  temptations avg ${(bought/N).toFixed(1)}`);
  }
}
// daily determinism
console.log("\n== DAILY determinism ==");
for(const tier of ["low","mid","high"]){
  const a=play(tier,S["avalanche+skip"],"daily"),b=play(tier,S["avalanche+skip"],"daily");
  console.log(tier,"run1 nw",a.nw,"run2 nw",b.nw,a.nw===b.nw&&a.st.interest===b.st.interest?"SAME":"DIFFERENT");
  if(a.nw!==b.nw)errors.push("daily not deterministic "+tier);
}
console.log("\nerrors:",errors.length?errors.slice(0,10):"none");
