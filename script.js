const codes={A:'fishcake',N:'snowstar',Y:'pinkfish'};
const rooms={dream:{title:'Dream Lodge',img:'assets/dream-lodge.png'},cafe:{title:'Café',img:'assets/cafe.png'},mall:{title:'Mall',img:'assets/mall.png'},fortune:{title:'Fortune Room',img:'assets/fortune.png'},hall:{title:'Hall',img:'assets/hall.png'},times:{title:'The Pink Penguin Times',img:'assets/times.png'}};
const fortunes=['A bow is in your future.','Someone is thinking about you.','Today is lucky.','You deserve a cupcake.','A royal promotion is coming.','The council says yes.','Glitter will solve this.','The fish sees drama.'];
const shop={
 mall:[['pinkBow','🎀 Pink Bow',50,'wear'],['crown','👑 Princess Crown',250,'wear'],['dress','👗 Glitter Dress',300,'wear'],['shoes','👠 Pink Shoes',150,'wear'],['bag','👜 Heart Handbag',200,'wear'],['tiara','💎 Diamond Tiara',1000,'wear']],
 dream:[['sofa','🛋️ Pink Sofa',50,'decor'],['rug','💗 Heart Rug',75,'decor'],['lamp','💡 Fairy Lamp',100,'decor'],['poster','🖼️ Penguin Poster',150,'decor'],['plant','🪴 Sparkle Plant',200,'decor']],
 fortune:[['crystal','🔮 Crystal Ball Skin',200,'bonus'],['charm','🍀 Lucky Charm',150,'bonus'],['moon','🌙 Moon Theme',300,'bonus']]
};
const quiz=[{q:'Pick a snack',a:[['Cupcake','Cupcake Queen'],['Snow cone','Snow Princess'],['Glitter soda','Glitter President']]},{q:'Pick a room',a:[['Mall','Bubblegum Duchess'],['Hall','Royal Strategist'],['Fortune','Crystal Empress']]},{q:'Pick a power',a:[['Finding bows','Bow Hunter'],['Winning debates','Glitter President'],['Being mysterious','Crystal Empress']]},{q:'Pick a colour',a:[['Pink','Bubblegum Duchess'],['White','Snow Princess'],['Gold','Royal Strategist']]},{q:'Pick a pet',a:[['Pink puffle','Glitter President'],['Penguin','Snow Princess'],['Royal puffle','Crystal Empress']]}];

let selected='A',current=null,room='map',quizIndex=0,quizScores={},placingItem=null;

function blankPlayer(){return{coins:100,xp:0,level:1,title:'New Penguin',inventory:[],wearing:'',decor:[],achievements:[],news:[]}}
function allData(){return JSON.parse(localStorage.getItem('ppcGameData_v2')||'{}')}
function saveAll(d){localStorage.setItem('ppcGameData_v2',JSON.stringify(d))}
function player(){let d=allData();if(!d[current]){d[current]=blankPlayer();saveAll(d)}return d[current]}
function savePlayer(p){let d=allData();d[current]=p;saveAll(d);renderStats();renderPenguin();if(room==='dream')renderDecor()}
function addCoins(n){let p=player();p.coins=Math.max(0,p.coins+n);p.xp+=Math.max(0,Math.floor(Math.max(n,0)/2));p.level=Math.floor(p.xp/100)+1;savePlayer(p)}
function addNews(text){let p=player();p.news=p.news||[];p.news.unshift(text);p.news=p.news.slice(0,8);savePlayer(p)}
function setTitle(t){let p=player();p.title=t;if(!p.achievements.includes(t))p.achievements.push(t);savePlayer(p);addNews(`${current} became ${t}.`)}
function renderStats(){let p=player();coinText.textContent=p.coins;xpText.textContent=p.xp;levelText.textContent=p.level;titleText.textContent=p.title;whoText.textContent=`Logged in as ${current}`}
function getItem(key){for(const list of Object.values(shop)){const f=list.find(i=>i[0]===key);if(f)return f}return null}

document.querySelectorAll('.member-btn').forEach(b=>b.onclick=()=>{selected=b.dataset.member;document.querySelectorAll('.member-btn').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
loginBtn.onclick=()=>{if(codes[selected]!==codeInput.value.trim()){loginMsg.textContent='Wrong penguin code';return}current=selected;loginScreen.classList.remove('active');gameScreen.classList.add('active');renderStats();showMap()};
codeInput.onkeydown=e=>{if(e.key==='Enter')loginBtn.click()};
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>openRoom(b.dataset.room));
backToMap.onclick=showMap;saveBtn.onclick=()=>{saveAll(allData());alert('Saved!')};
modalClose.onclick=closeModal;

function showMap(){mapView.classList.add('active');roomView.classList.remove('active')}
function openRoom(r){room=r;mapView.classList.remove('active');roomView.classList.add('active');roomTitle.textContent=rooms[r].title;roomImage.src=rooms[r].img;decorLayer.innerHTML='';shopArea.innerHTML='';roomInfo.innerHTML='';placingItem=null;renderPenguin();renderRoom(r)}
function renderRoom(r){renderDecor();if(r==='dream')dream();if(r==='cafe')cafe();if(r==='mall')mall();if(r==='fortune')fortune();if(r==='hall')hall();if(r==='times')times()}
function openModal(title,body){modalTitle.textContent=title;modalBody.innerHTML=body;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden');modalBody.innerHTML=''}
function renderPenguin(){let p=current?player():blankPlayer();wearingLayer.textContent=p.wearing?(getItem(p.wearing)?.[1].split(' ')[0]||''):'';penguinName.textContent=current||''}

roomStage.addEventListener('click',e=>{
 if(room!=='dream'||!placingItem)return;
 const rect=roomStage.getBoundingClientRect();
 const x=((e.clientX-rect.left)/rect.width)*100;
 const y=((e.clientY-rect.top)/rect.height)*100;
 let p=player();
 p.decor=p.decor||[];
 const item=getItem(placingItem);
 p.decor.push({key:placingItem,emoji:item[1].split(' ')[0],x,y});
 placingItem=null;
 savePlayer(p);
 renderShop('dream','Furniture Shop');
});

function renderDecor(){
 decorLayer.innerHTML='';
 if(room!=='dream')return;
 let p=player();
 (p.decor||[]).forEach((d,i)=>{
  decorLayer.innerHTML+=`<div class="decor-item" style="left:${d.x}%;top:${d.y}%">${d.emoji}</div>`;
 });
}

function dream(){
 roomInfo.innerHTML=`<div class="card"><h3>🏰 Dream Lodge</h3><p class="room-note">Buy furniture, then click Place and choose the spot inside your lodge. Furniture only appears here now.</p><button class="game-btn" onclick="startBowHunt()">Start Bow Hunt</button><button class="plain-btn" onclick="clearDecor()">Clear Furniture</button></div>`;
 renderShop('dream','Furniture Shop');
}
function clearDecor(){let p=player();p.decor=[];savePlayer(p);renderDecor()} window.clearDecor=clearDecor;

function startBowHunt(){
 openModal('🎀 Bow Hunt',`<p>Find all 8 bows. They are different sizes and easier to see now.</p><div class="image-stage mini-stage"><img src="assets/dream-lodge.png"><div id="bowLayer" style="position:absolute;inset:0"></div></div><p id="bowScore">Found 0 / 8 bows</p>`);
 let found=0,spots=[[12,28,34,'#ff1493'],[26,62,48,'#ffffff'],[42,21,28,'#ff66c4'],[55,72,40,'#d1007d'],[68,31,55,'#fff000'],[81,58,32,'#ff1493'],[33,42,44,'#ffffff'],[74,75,36,'#d1007d']];
 spots.forEach(s=>{let bow=document.createElement('div');bow.className='bow';bow.textContent='🎀';bow.style.left=s[0]+'%';bow.style.top=s[1]+'%';bow.style.fontSize=s[2]+'px';bow.style.color=s[3];bow.onclick=()=>{bow.remove();found++;bowScore.textContent=`Found ${found} / 8 bows`;addCoins(5);if(found===8){addCoins(40);setTitle('Bow Hunter');alert('You found all bows! +80 total coins and Bow Hunter title')}};bowLayer.appendChild(bow)})
}
window.startBowHunt=startBowHunt;

function cafe(){
 roomInfo.innerHTML=`<div class="card"><h3>☕ Café</h3><p>Play Cupcake Catch as a pop-up game. Catch cupcakes, avoid broccoli.</p><button class="game-btn" onclick="startCupcakeCatch()">Start Cupcake Catch</button></div>`;
 shopArea.innerHTML=`<div class="card"><h3>Recipes</h3><span class="badge">🧁 Cupcake Recipe</span><span class="badge">🧋 Bubble Tea Recipe</span><span class="badge">🍓 Strawberry Latte</span></div>`;
}
function startCupcakeCatch(){
 openModal('🧁 Cupcake Catch',`<p>Move with arrow keys or buttons. 30 seconds.</p><p>Score: <b id="catchScore">0</b> | Time: <b id="catchTime">30</b></p><div id="gameCanvas"><div id="catcher" class="catcher">🐧</div></div><p><button class="small-btn" id="leftBtn">←</button><button class="small-btn" id="rightBtn">→</button></p>`);
 let score=0,time=30,x=45,active=true,drops=[];
 const move=dir=>{x=Math.max(0,Math.min(90,x+dir));catcher.style.left=x+'%'};
 leftBtn.onclick=()=>move(-8);rightBtn.onclick=()=>move(8);
 const key=e=>{if(e.key==='ArrowLeft')move(-7);if(e.key==='ArrowRight')move(7)};document.addEventListener('keydown',key);
 const spawn=setInterval(()=>{if(!active)return;let el=document.createElement('div');el.className='falling';el.textContent=Math.random()<.78?'🧁':'🥦';el.style.left=Math.random()*90+'%';gameCanvas.appendChild(el);drops.push({el,y:-45,x:parseFloat(el.style.left),bad:el.textContent==='🥦'})},520);
 const loop=setInterval(()=>{drops.forEach(d=>{d.y+=5;d.el.style.top=d.y+'px';if(d.y>315&&d.y<375&&Math.abs(d.x-x)<10&&!d.hit){d.hit=true;d.el.remove();score+=d.bad?-3:1;catchScore.textContent=score}if(d.y>450)d.el.remove()});drops=drops.filter(d=>!d.hit&&d.y<450)},40);
 const clock=setInterval(()=>{time--;catchTime.textContent=time;if(time<=0){active=false;clearInterval(spawn);clearInterval(loop);clearInterval(clock);document.removeEventListener('keydown',key);let coins=Math.max(0,score*3);addCoins(coins);addNews(`${current} played Cupcake Catch and scored ${score}.`);if(score>=15)setTitle('Cupcake Queen');alert(`Game over! Score ${score}. You earned ${coins} coins.`)}},1000);
}
window.startCupcakeCatch=startCupcakeCatch;

function mall(){
 roomInfo.innerHTML=`<div class="card"><h3>🎀 Mall</h3><p>Buy clothes and click Wear. Your penguin shows the item in every room.</p><button class="game-btn" onclick="startMemory()">Start Mall Memory</button></div>`;
 renderShop('mall','Mall Shop');
}
function startMemory(){
 openModal('💎 Mall Memory',`<p>Match all 8 pairs for 50 coins.</p><div class="memory-grid" id="memGrid"></div>`);
 const emojis=['🎀','👠','👜','💄','👑','🧁','💎','🐧'];let cards=[...emojis,...emojis].sort(()=>Math.random()-.5),first=null,lock=false,matched=0;
 cards.forEach(e=>{let c=document.createElement('div');c.className='memory-card';c.textContent='?';c.onclick=()=>{if(lock||c.classList.contains('done')||c.textContent!=='?')return;c.textContent=e;if(!first){first={c,e};return}if(first.e===e){c.classList.add('done');first.c.classList.add('done');matched++;first=null;if(matched===8){addCoins(50);addNews(`${current} won Mall Memory.`);alert('You won Mall Memory! +50 coins')}}else{lock=true;setTimeout(()=>{c.textContent='?';first.c.textContent='?';first=null;lock=false},700)}};memGrid.appendChild(c)});
}
window.startMemory=startMemory;

function fortune(){
 roomInfo.innerHTML=`<div class="card"><h3>🔮 Fortune Fish</h3><p>Click the fish for a fortune. Each fortune gives 5 coins.</p><button class="game-btn" onclick="fortuneFish()">🐟 Click Fish</button><p id="fortuneText"></p></div>`;
 renderShop('fortune','Mystic Shop');
}
function fortuneFish(){fortuneText.textContent=fortunes[Math.floor(Math.random()*fortunes.length)];addCoins(5);addNews(`${current} visited the Fortune Fish.`)}
window.fortuneFish=fortuneFish;

function hall(){
 const d=allData(); const rows=['A','N','Y'].map(id=>[id,d[id]||blankPlayer()]).sort((a,b)=>(b[1].xp||0)-(a[1].xp||0));
 roomInfo.innerHTML=`<div class="card"><h3>🏆 Hall Leaderboard</h3><div class="leader-grid">${rows.map(([id,p],i)=>`<div class="leader-card">${i+1}. 🐧 ${id}<br>Lv ${p.level||1}<br>🪙 ${p.coins||0}<br>${p.title||'New Penguin'}</div>`).join('')}</div><button class="game-btn" onclick="startQuiz()">Take Penguin Quiz</button></div>`;
 shopArea.innerHTML=`<div class="card"><h3>Your Trophies</h3>${(player().achievements||[]).map(a=>`<span class="badge">${a}</span>`).join('')||'No titles yet.'}</div>`;
}
function startQuiz(){quizIndex=0;quizScores={};showQuiz()}
function showQuiz(){let q=quiz[quizIndex];openModal('🧠 Penguin Quiz',`<p>${q.q}</p><div class="quiz-answers">${q.a.map(([text,title])=>`<button class="answer-btn" onclick="quizAnswer('${title}')">${text}</button>`).join('')}</div>`)}
function quizAnswer(title){quizScores[title]=(quizScores[title]||0)+1;quizIndex++;if(quizIndex>=quiz.length){let winner=Object.entries(quizScores).sort((a,b)=>b[1]-a[1])[0][0];setTitle(winner);modalBody.innerHTML=`<h3>Your title is ${winner}!</h3><p>Added to your Hall trophies.</p>`;hall()}else showQuiz()}
window.startQuiz=startQuiz;window.quizAnswer=quizAnswer;

function times(){
 const d=allData(); const rows=['A','N','Y'].map(id=>{let p=d[id]||blankPlayer();return `${id} is Level ${p.level||1}, has ${p.coins||0} coins and is titled ${p.title||'New Penguin'}.`});
 const p=player(); const today=new Date().toDateString(); const claimed=p.newsClaimDate===today;
 roomInfo.innerHTML=`<div class="card"><h3>📰 The Pink Penguin Times</h3><div class="news-box"><div class="headline" id="dailyHeadline">${randomHeadline()}</div><p>Fresh island gossip, club updates and suspiciously important headlines.</p></div><button class="game-btn" onclick="newHeadline()">New Headline</button><button class="game-btn" onclick="claimTimesCoins()">${claimed?'Coins claimed today':'Claim reader coins'}</button><h3>Top Players</h3><p>${rows.join('<br>')}</p></div>`;
 shopArea.innerHTML=`<div class="card"><h3>Recent News</h3>${collectNews().map(n=>`<div class="news-box">${n}</div>`).join('')||'<p>No news yet. Go make some drama.</p>'}</div>`;
}
function randomHeadline(){const h=['Fashion show rumours shake the island.','Cupcake economy reaches historic levels.','Bow sightings reported in Dream Lodge.','Fortune Fish refuses to comment.','Mall announces suspiciously pink sale.','Council confirms everyone is iconic.'];return h[Math.floor(Math.random()*h.length)]}
function newHeadline(){dailyHeadline.textContent=randomHeadline();addCoins(1)}
function claimTimesCoins(){let p=player();let today=new Date().toDateString();if(p.newsClaimDate===today){alert('Already claimed today.');return}p.newsClaimDate=today;p.coins+=20;p.xp+=10;p.level=Math.floor(p.xp/100)+1;savePlayer(p);addNews(`${current} read The Pink Penguin Times.`);times();alert('+20 coins for reading the Times.')}
function collectNews(){let d=allData();return Object.values(d).flatMap(p=>p.news||[]).slice(0,10)}
window.newHeadline=newHeadline;window.claimTimesCoins=claimTimesCoins;

function renderShop(type,title){
 let p=player();
 shopArea.innerHTML=`<div class="card"><h3>${title}</h3><div class="shop-grid">${shop[type].map(([key,name,cost,kind])=>{
  const owned=p.inventory.includes(key);
  let action=owned?(kind==='wear'?(p.wearing===key?'Wearing':'Wear'):(kind==='decor'?'Place':'Owned')):'Buy';
  return `<div class="shop-item"><div>${name}</div><div>🪙 ${cost}</div><button class="buy-btn" onclick="shopAction('${type}','${key}')">${action}</button></div>`;
 }).join('')}</div></div>`;
}
function shopAction(type,key){
 let item=shop[type].find(x=>x[0]===key),p=player();if(!item)return;
 const [id,name,cost,kind]=item;
 if(!p.inventory.includes(key)){
   if(p.coins<cost){alert('Not enough coins.');return}
   p.coins-=cost;p.inventory.push(key);addNews(`${current} bought ${name}.`);
 }
 if(kind==='wear'){p.wearing=key;savePlayer(p);renderShop(type,type==='mall'?'Mall Shop':'Shop');return}
 if(kind==='decor'){savePlayer(p);placingItem=key;alert('Now click inside Dream Lodge to place it.');return}
 savePlayer(p);renderShop(type,'Mystic Shop');
}
window.shopAction=shopAction;
