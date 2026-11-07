const {JSDOM,VirtualConsole}=require("jsdom");const fs=require("fs");
const html=fs.readFileSync(require("path").join(__dirname,"..","index.html"),"utf8");const errs=[];
const vc=new VirtualConsole();vc.on("jsdomError",e=>{if(!/Not implemented/.test(e.message))errs.push(e.message)});
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.matchMedia=q=>({matches:/reduce/.test(q),addEventListener(){},removeEventListener(){}});w.addEventListener("error",e=>errs.push(e.message))}});
const w=dom.window,G=w.__game,d=w.document;
function av(buf){buf=Math.min(buf||0,G.freeCash());G.S.cash-=buf;let k=0;while(G.freeCash()>0&&G.S.mons.length&&k++<80){const m=G.S.mons.slice().sort((a,b)=>b.rate-a.rate)[0];const c=G.S.cash;G.pay(m.id,true);G.S.busy=false;if(G.S.cash===c)break}G.S.cash+=buf}
const STR={
 idle:{life:1,sv:1,pay:false,temp:"skip",raise:"debt"},
 "aval default":{life:1,sv:1,pay:true,temp:"skip",raise:"debt"},
 "frugal sv0":{life:0,sv:0,pay:true,temp:"skip",raise:"debt"},
 "frugal sv10":{life:0,sv:1,pay:true,temp:"skip",raise:"save"},
 "comfy sv0":{life:1,sv:0,pay:true,temp:"skip",raise:"debt"},
 "lavish sv0":{life:2,sv:0,pay:true,temp:"skip",raise:"life"},
 "lavish+status":{life:2,sv:0,pay:true,temp:"card",raise:"life"},
 "comfy+status":{life:1,sv:1,pay:true,temp:"card",raise:"life"},
 "smart":{smart:true,pay:true,buf:1,temp:"skip",raise:"save"},
 "smart no buf":{smart:true,pay:true,buf:0,temp:"skip",raise:"save"},
 "comfy sv10 buf":{life:1,sv:1,pay:true,buf:1,temp:"skip",raise:"debt"}
};
function play(tier,st,mode,seed){G.newGame(tier,mode||"free");if(seed!==undefined)G.seed(seed);let n=0;
 while(!G.S.over&&n++<40){
  if(st.smart){const hi=G.S.mons.some(m=>m.rate>=.04);G.setBud("life",0);G.setBud("sv",hi?0:(G.S.assets.vault<3*(G.budget().needs+G.budget().wants)?2:1))}
  else{G.setBud("life",st.life);G.setBud("sv",st.sv)}
  if(G.S.temp){if(st.temp==="skip")G.skipTemp();else G.buyTemp(true)}
  if(st.pay)av(st.buf?G.budget().needs*1.5:0);
  G.endMonth();const c=d.querySelector("#cont");if(c)c.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));G.S.busy=false;
  if(G.S.raise)G.raisePick(st.raise);
 }
 const S=G.S,debt=S.mons.reduce((a,m)=>a+m.debt,0);const nw=S.cash+S.assets.vault+S.assets.index+S.assets.dragon-debt;
 return{done:S.done,debt,nw,stars:G.starsFor(S.done),st:{...S.stats},fort:S.fortress,month:S.month}}
const tiers=process.argv[2]?[process.argv[2]]:["mid"];const N=+process.argv[3]||16;
for(const tier of tiers){console.log("\n==",tier);
 for(const [n,st] of Object.entries(STR)){let surv=0,free=0,s2=0,s3=0,nws=[],em=0,bd=0,fo=0,fu=0;
  for(let i=0;i<N;i++){const r=play(tier,st);if(r.done)surv++;if(r.done&&r.debt===0)free++;if(r.stars===3)s3++;nws.push(r.nw);em+=r.st.emerg;bd+=r.st.billDebt>0?1:0;fo+=r.fort?1:0;fu+=r.st.fundUsed}
  nws.sort((a,b)=>a-b);
  console.log(n.padEnd(14),`surv ${String(surv).padStart(2)}/${N} free ${String(free).padStart(2)} 3★ ${s3} medNW ${String(nws[N>>1]).padStart(6)} emergImp/run ${(em/N).toFixed(1)} billDebt runs ${bd} fortress ${fo} fundUsed/run ${(fu/N).toFixed(0)}`)}}
console.log("\n== daily determinism ==");
for(const t of ["low","mid","high"]){const a=play(t,STR["smart"],"daily"),b=play(t,STR["smart"],"daily");const ok=a.nw===b.nw&&a.st.interest===b.st.interest;console.log(t,ok?"SAME":"DIFFERENT");if(!ok)errs.push("daily not deterministic "+t)}
console.log("errors:",errs.length?errs.slice(0,5):"none");
