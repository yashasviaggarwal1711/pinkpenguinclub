import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA84lmtU1xvNPfpZ5I6VUdpatX2BjTAm5I",
  authDomain: "pink-penguin-club.firebaseapp.com",
  projectId: "pink-penguin-club",
  storageBucket: "pink-penguin-club.firebasestorage.app",
  messagingSenderId: "403933739896",
  appId: "1:403933739896:web:bf149d3d475185c3e3668d",
  measurementId: "G-3DEFNG6VHE"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const codes={A:'fishcake',N:'snowstar',Y:'pinkfish'};
const rooms={dream:{title:'Dream Lodge',img:'assets/dream-lodge.png'},cafe:{title:'Café',img:'assets/cafe.png'},mall:{title:'Mall',img:'assets/mall.png'},fortune:{title:'Fortune Room',img:'assets/fortune.png'},hall:{title:'Hall',img:'assets/hall.png'},times:{title:'The Pink Penguin Times',img:'assets/times.png'}};
const roomNames={dream:'Dream Lodge',cafe:'Café',mall:'Mall',fortune:'Fortune',hall:'Hall',times:'Times'};
const fortunes=['A bow is in your future.','Someone is thinking about you.','Today is lucky.','You deserve a cupcake.','A royal promotion is coming.','The council says yes.','Glitter will solve this.','The fish sees drama.','The island thinks you are iconic.','A cupcake will change everything.'];
const shop={
 mall:[['pinkBow','🎀 Pink Bow',50,'wear'],['crown','👑 Princess Crown',250,'wear'],['dress','👗 Glitter Dress',300,'wear'],['shoes','👠 Pink Shoes',150,'wear'],['bag','👜 Heart Handbag',200,'wear'],['tiara','💎 Diamond Tiara',1000,'wear']],
 dream:[['sofa','🛋️ Pink Sofa',50,'decor'],['rug','💗 Heart Rug',75,'decor'],['lamp','💡 Fairy Lamp',100,'decor'],['poster','🖼️ Penguin Poster',150,'decor'],['plant','🪴 Sparkle Plant',200,'decor']],
 fortune:[['crystal','🔮 Crystal Ball Skin',200,'bonus'],['charm','🍀 Lucky Charm',150,'bonus'],['moon','🌙 Moon Theme',300,'bonus']]
};
const quiz=[{q:'Pick a snack',a:[['Cupcake','Cupcake Queen'],['Snow cone','Snow Princess'],['Glitter soda','Glitter President']]},{q:'Pick a room',a:[['Mall','Bubblegum Duchess'],['Hall','Royal Strategist'],['Fortune','Crystal Empress']]},{q:'Pick a power',a:[['Finding bows','Bow Hunter'],['Winning debates','Glitter President'],['Being mysterious','Crystal Empress']]},{q:'Pick a colour',a:[['Pink','Bubblegum Duchess'],['White','Snow Princess'],['Gold','Royal Strategist']]},{q:'Pick a pet',a:[['Pink puffle','Glitter President'],['Penguin','Snow Princess'],['Royal puffle','Crystal Empress']]}];

let selected='A',current=null,room='dream',quizIndex=0,quizScores={},placingItem=null;
let members={}, presence={}, messages=[];

const blank=()=>({coins:100,xp:0,level:1,title:'New Penguin',inventory:[],wearing:'',decor:[],achievements:[],news:[]});
const getItem=key=>Object.values(shop).flat().find(i=>i[0]===key);
const me=()=>members[current]||blank();

document.querySelectorAll('.member-btn').forEach(b=>b.onclick=()=>{selected=b.dataset.member;document.querySelectorAll('.member-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
loginBtn.onclick=login;
codeInput.onkeydown=e=>{if(e.key==='Enter')login()};
modalClose.onclick=closeModal;
backToMap.onclick=showMap;
saveBtn.onclick=()=>alert('Saved online with Firebase.');
sendChatBtn.onclick=sendChat;
chatInput.onkeydown=e=>{if(e.key==='Enter')sendChat()};
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>openRoom(b.dataset.room));
window.addEventListener('beforeunload',()=>{if(current)setDoc(doc(db,'presence',current),{online:false},{merge:true})});

async function login(){
 if(codes[selected]!==codeInput.value.trim()){loginMsg.textContent='Wrong penguin code';return}
 current=selected;
 await ensureMember(current);
 await setDoc(doc(db,'presence',current),{room:'map',online:true,x:50,y:70},{merge:true});
 loginScreen.classList.remove('active');gameScreen.classList.add('active');
 setupListeners(); showMap();
}
async function ensureMember(id){
 const ref=doc(db,'members',id); const snap=await getDoc(ref);
 if(!snap.exists()){await setDoc(ref,blank());return}
 const d=snap.data(), patch={};
 ['coins','xp','level','title','inventory','wearing','decor','achievements','news'].forEach(k=>{if(d[k]===undefined)patch[k]=blank()[k]});
 if(Object.keys(patch).length)await setDoc(ref,patch,{merge:true});
}
function setupListeners(){
 onSnapshot(collection(db,'members'),snap=>{members={};snap.forEach(d=>members[d.id]=d.data());renderStats();renderPlayers();if(room==='hall')hall();if(room==='times')times();});
 onSnapshot(collection(db,'presence'),snap=>{presence={};snap.forEach(d=>presence[d.id]=d.data());renderPlayers();});
 onSnapshot(collection(db,'messages'),snap=>{messages=[];snap.forEach(d=>messages.push({id:d.id,...d.data()}));renderChat();});
}
function renderStats(){if(!current)return;let p=me();coinText.textContent=p.coins||0;xpText.textContent=p.xp||0;levelText.textContent=p.level||1;titleText.textContent=p.title||'New Penguin';whoText.textContent=`Logged in as ${current}`}
async function patchMe(data){await setDoc(doc(db,'members',current),data,{merge:true})}
async function addCoins(n){let p=me();let newXP=(p.xp||0)+Math.max(0,Math.floor(Math.max(n,0)/2));await patchMe({coins:Math.max(0,(p.coins||0)+n),xp:newXP,level:Math.floor(newXP/100)+1})}
async function setTitle(t){let p=me();let ach=p.achievements||[];if(!ach.includes(t))ach.push(t);await patchMe({title:t,achievements:ach});await addNews(`${current} became ${t}.`)}
async function addNews(text){let p=me();let news=p.news||[];news.unshift(text);await patchMe({news:news.slice(0,8)})}

function showMap(){mapView.classList.add('active');roomView.classList.remove('active');setDoc(doc(db,'presence',current),{room:'map',online:true},{merge:true})}
async function openRoom(r){room=r;mapView.classList.remove('active');roomView.classList.add('active');roomTitle.textContent=rooms[r].title;roomImage.src=rooms[r].img;decorLayer.innerHTML='';floatingRoomPanel.innerHTML='';placingItem=null;await setDoc(doc(db,'presence',current),{room:r,online:true,x:50,y:70},{merge:true});renderRoom(r);renderPlayers();renderChat()}
function renderRoom(r){renderDecor();if(r==='dream')dream();if(r==='cafe')cafe();if(r==='mall')mall();if(r==='fortune')fortune();if(r==='hall')hall();if(r==='times')times()}
function renderPlayers(){
 if(!current||!playersLayer)return;
 const spots={A:[47,78],N:[58,78],Y:[69,78]};
 playersLayer.innerHTML=['A','N','Y'].map(id=>{
   const p=presence[id]||{}, m=members[id]||blank();
   if(p.room!==room || !p.online)return '';
   const item=m.wearing?(getItem(m.wearing)?.[1].split(' ')[0]||''):'';
   return `<div class="player ${id===current?'me':''}" style="left:${spots[id][0]}%;top:${spots[id][1]}%"><div class="wear">${item}</div><div class="body">🐧</div><div class="name">${id}</div></div>`;
 }).join('');
}
roomStage.addEventListener('click',async e=>{
 if(room!=='dream'||!placingItem)return;
 const rect=roomStage.getBoundingClientRect(); const x=((e.clientX-rect.left)/rect.width)*100; const y=((e.clientY-rect.top)/rect.height)*100;
 let p=me(), decor=p.decor||[], item=getItem(placingItem);
 decor.push({key:placingItem,emoji:item[1].split(' ')[0],x,y}); placingItem=null;
 await patchMe({decor}); dream(); renderDecor();
});
function renderDecor(){
 decorLayer.innerHTML='';
 if(room!=='dream')return;
 (me().decor||[]).forEach(d=>decorLayer.innerHTML+=`<div class="decor-item" style="left:${d.x}%;top:${d.y}%">${d.emoji}</div>`);
}

function setFloating(html){floatingRoomPanel.innerHTML=html}
function dream(){setFloating(`<h3>🏰 Dream Lodge</h3><p>Bow Hunt + furniture.</p><div class="overlay-buttons"><button class="game-btn" onclick="startBowHunt()">Bow Hunt</button><button class="plain-btn" onclick="clearDecor()">Clear Furniture</button></div><details><summary>🛋️ Furniture Shop</summary>${shopHTML('dream','Furniture Shop')}</details>`)}
async function clearDecor(){await patchMe({decor:[]});renderDecor();dream()} window.clearDecor=clearDecor;

function cafe(){setFloating(`<h3>☕ Café</h3><p>Play Cupcake Catch. Catch cupcakes and avoid broccoli.</p><button class="game-btn" onclick="startCupcakeCatch()">Start Cupcake Catch</button><div class="card"><h3>Recipes</h3><span class="badge">🧁 Cupcake Recipe</span><span class="badge">🧋 Bubble Tea Recipe</span><span class="badge">🍓 Strawberry Latte</span></div>`)}
function mall(){setFloating(`<h3>🎀 Mall</h3><p>Shop + Mall Memory.</p><button class="game-btn" onclick="startMemory()">Mall Memory</button><details open><summary>🛍️ Mall Shop</summary>${shopHTML('mall','Mall Shop')}</details>`)}
function fortune(){setFloating(`<h3>🔮 Fortune Fish</h3><p>Click for fortune + 5 coins.</p><button class="game-btn" onclick="fortuneFish()">🐟 Click Fish</button><p id="fortuneText" class="headline"></p><details><summary>🔮 Mystic Shop</summary>${shopHTML('fortune','Mystic Shop')}</details>`)}
function hall(){
 const rows=['A','N','Y'].map(id=>[id,members[id]||blank()]).sort((a,b)=>(b[1].xp||0)-(a[1].xp||0));
 setFloating(`<h3>🏆 Hall Leaderboard</h3><div class="leader-grid">${rows.map(([id,p],i)=>`<div class="leader-card">${i+1}. 🐧 ${id}<br>Lv ${p.level||1}<br>🪙 ${p.coins||0}<br>${p.title||'New Penguin'}</div>`).join('')}</div><button class="game-btn" onclick="startQuiz()">Take Penguin Quiz</button><div class="card"><h3>Your Trophies</h3>${(me().achievements||[]).map(a=>`<span class="badge">${a}</span>`).join('')||'No titles yet.'}</div>`);
}
function times(){
 const rows=['A','N','Y'].map(id=>{let p=members[id]||blank();return `${id}: Level ${p.level||1}, ${p.coins||0} coins, ${p.title||'New Penguin'}.`});
 const p=me(); const today=new Date().toDateString(); const claimed=p.newsClaimDate===today;
 setFloating(`<h3>📰 Pink Penguin Times</h3><div class="news-box"><div class="headline" id="dailyHeadline">${randomHeadline()}</div><p>Fresh island gossip and suspiciously important headlines.</p></div><button class="game-btn" onclick="newHeadline()">New Headline</button><button class="game-btn" onclick="claimTimesCoins()">${claimed?'Coins claimed today':'Claim reader coins'}</button><h3>Top Players</h3><p>${rows.join('<br>')}</p><div class="card"><h3>Recent News</h3>${collectNews().map(n=>`<div class="news-box">${n}</div>`).join('')||'<p>No news yet. Go make some drama.</p>'}</div>`);
}

function shopHTML(type,title){
 let p=me();
 return `<div class="card"><h3>${title}</h3><div class="shop-grid">${shop[type].map(([key,name,cost,kind])=>{
  const owned=(p.inventory||[]).includes(key);
  let action=owned?(kind==='wear'?(p.wearing===key?'Wearing':'Wear'):(kind==='decor'?'Place':'Owned')):'Buy';
  return `<div class="shop-item"><div>${name}</div><div>🪙 ${cost}</div><button class="buy-btn" onclick="shopAction('${type}','${key}')">${action}</button></div>`;
 }).join('')}</div></div>`;
}
async function shopAction(type,key){
 let item=shop[type].find(x=>x[0]===key),p=me(); if(!item)return;
 const [id,name,cost,kind]=item; let inv=p.inventory||[];
 if(!inv.includes(key)){if((p.coins||0)<cost){alert('Not enough coins.');return}inv.push(key);await patchMe({coins:(p.coins||0)-cost,inventory:inv});await addNews(`${current} bought ${name}.`)}
 if(kind==='wear'){await patchMe({wearing:key})}
 if(kind==='decor'){placingItem=key;alert('Now click inside Dream Lodge to place it.')}
 renderRoom(room);
}
window.shopAction=shopAction;

function openModal(title,body){modalTitle.textContent=title;modalBody.innerHTML=body;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden');modalBody.innerHTML=''}
function startBowHunt(){
 openModal('🎀 Bow Hunt',`<p>Find all 8 bows.</p><div class="image-stage mini-stage"><img src="assets/dream-lodge.png"><div id="bowLayer" style="position:absolute;inset:0"></div></div><p id="bowScore">Found 0 / 8 bows</p>`);
 let found=0,spots=[[12,28,34,'#ff1493'],[26,62,48,'#ffffff'],[42,21,28,'#ff66c4'],[55,72,40,'#d1007d'],[68,31,55,'#fff000'],[81,58,32,'#ff1493'],[33,42,44,'#ffffff'],[74,75,36,'#d1007d']];
 spots.forEach(s=>{let bow=document.createElement('div');bow.className='bow';bow.textContent='🎀';bow.style.left=s[0]+'%';bow.style.top=s[1]+'%';bow.style.fontSize=s[2]+'px';bow.style.color=s[3];bow.onclick=async()=>{bow.remove();found++;bowScore.textContent=`Found ${found} / 8 bows`;await addCoins(5);if(found===8){await addCoins(40);await setTitle('Bow Hunter');alert('You found all bows!')}};bowLayer.appendChild(bow)})
}
window.startBowHunt=startBowHunt;

window.startCupcakeCatch=()=> {
 openModal('🧁 Cupcake Catch',`<p>Move with arrow keys or buttons. 30 seconds.</p><p>Score: <b id="catchScore">0</b> | Time: <b id="catchTime">30</b></p><div id="gameCanvas"><div id="catcher" class="catcher">🐧</div></div><p><button class="small-btn" id="leftBtn">←</button><button class="small-btn" id="rightBtn">→</button></p>`);
 let score=0,time=30,x=45,active=true,drops=[];
 const move=dir=>{x=Math.max(0,Math.min(90,x+dir));catcher.style.left=x+'%'};
 leftBtn.onclick=()=>move(-8);rightBtn.onclick=()=>move(8);
 const key=e=>{if(e.key==='ArrowLeft')move(-7);if(e.key==='ArrowRight')move(7)};document.addEventListener('keydown',key);
 const spawn=setInterval(()=>{if(!active)return;let el=document.createElement('div');el.className='falling';el.textContent=Math.random()<.78?'🧁':'🥦';el.style.left=Math.random()*90+'%';gameCanvas.appendChild(el);drops.push({el,y:-45,x:parseFloat(el.style.left),bad:el.textContent==='🥦'})},520);
 const loop=setInterval(()=>{drops.forEach(d=>{d.y+=5;d.el.style.top=d.y+'px';if(d.y>315&&d.y<375&&Math.abs(d.x-x)<10&&!d.hit){d.hit=true;d.el.remove();score+=d.bad?-3:1;catchScore.textContent=score}if(d.y>450)d.el.remove()});drops=drops.filter(d=>!d.hit&&d.y<450)},40);
 const clock=setInterval(async()=>{time--;catchTime.textContent=time;if(time<=0){active=false;clearInterval(spawn);clearInterval(loop);clearInterval(clock);document.removeEventListener('keydown',key);let coins=Math.max(0,score*3);await addCoins(coins);await addNews(`${current} played Cupcake Catch and scored ${score}.`);if(score>=15)await setTitle('Cupcake Queen');alert(`Game over! Score ${score}. You earned ${coins} coins.`)}},1000);
};

function startMemory(){
 const pool=['🎀','👠','👜','💄','👑','🧁','💎','🐧','🌸','🩷','✨','🧋'];
 let cards=[...pool,...pool,'⭐'].sort(()=>Math.random()-.5);
 openModal('💎 Mall Memory',`<p>5x5 board. Match 12 pairs. ⭐ is a free bonus card. New layout every game.</p><div class="memory-grid big" id="memGrid"></div><p id="memScore">Matched 0 / 12</p>`);
 let first=null,lock=false,matched=0,bonusUsed=false;
 cards.forEach(e=>{let c=document.createElement('div');c.className='memory-card';c.textContent='?';c.onclick=async()=>{if(lock||c.classList.contains('done')||c.textContent!=='?')return;c.textContent=e;if(e==='⭐'){c.classList.add('done');if(!bonusUsed){bonusUsed=true;await addCoins(10)}return}if(!first){first={c,e};return}if(first.e===e){c.classList.add('done');first.c.classList.add('done');matched++;memScore.textContent=`Matched ${matched} / 12`;first=null;if(matched===12){await addCoins(75);await addNews(`${current} won 5x5 Mall Memory.`);alert('You won Mall Memory! +75 coins')}}else{lock=true;setTimeout(()=>{c.textContent='?';first.c.textContent='?';first=null;lock=false},700)}};memGrid.appendChild(c)});
}
window.startMemory=startMemory;

async function fortuneFish(){
 const f=fortunes[Math.floor(Math.random()*fortunes.length)];
 const el=document.getElementById('fortuneText'); if(el)el.textContent=f;
 await addCoins(5); await addNews(`${current} got a fortune: "${f}"`);
}
window.fortuneFish=fortuneFish;

function startQuiz(){quizIndex=0;quizScores={};showQuiz()}
function showQuiz(){let q=quiz[quizIndex];openModal('🧠 Penguin Quiz',`<p>${q.q}</p><div class="quiz-answers">${q.a.map(([text,title])=>`<button class="answer-btn" onclick="quizAnswer('${title}')">${text}</button>`).join('')}</div>`)}
async function quizAnswer(title){quizScores[title]=(quizScores[title]||0)+1;quizIndex++;if(quizIndex>=quiz.length){let winner=Object.entries(quizScores).sort((a,b)=>b[1]-a[1])[0][0];await setTitle(winner);modalBody.innerHTML=`<h3>Your title is ${winner}!</h3><p>Added to your Hall trophies.</p>`;hall()}else showQuiz()}
window.startQuiz=startQuiz;window.quizAnswer=quizAnswer;

function randomHeadline(){const h=['Fashion show rumours shake the island.','Cupcake economy reaches historic levels.','Bow sightings reported in Dream Lodge.','Fortune Fish refuses to comment.','Mall announces suspiciously pink sale.','Council confirms everyone is iconic.'];return h[Math.floor(Math.random()*h.length)]}
async function newHeadline(){dailyHeadline.textContent=randomHeadline();await addCoins(1)}
async function claimTimesCoins(){let p=me();let today=new Date().toDateString();if(p.newsClaimDate===today){alert('Already claimed today.');return}await patchMe({newsClaimDate:today,coins:(p.coins||0)+20,xp:(p.xp||0)+10,level:Math.floor(((p.xp||0)+10)/100)+1});await addNews(`${current} read The Pink Penguin Times.`);times();alert('+20 coins for reading the Times.')}
function collectNews(){return Object.values(members).flatMap(p=>p.news||[]).slice(0,10)}
window.newHeadline=newHeadline;window.claimTimesCoins=claimTimesCoins;

async function sendChat(){
 const text=chatInput.value.trim(); if(!text||!current)return; chatInput.value='';
 await addDoc(collection(db,'messages'),{from:current,text,room:'global',createdAt:Date.now()});
}
function renderChat(){
 if(!current||!chatMessages)return;
 const shown=messages
   .sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))
   .slice(-60);

 chatMessages.innerHTML =
   `<p class="global-chat-note">Global club chat. Everyone sees this in every room.</p>` +
   (shown.map(m=>`<div class="chat-msg"><b>${escapeHTML(m.from||'?')}:</b><div>${escapeHTML(m.text||'')}</div></div>`).join('') || '<p class="tiny">No messages yet.</p>');

 chatMessages.scrollTop=chatMessages.scrollHeight;
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
