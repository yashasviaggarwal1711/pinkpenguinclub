import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  increment
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

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

const codes = { A: "fishcake", N: "snowstar", Y: "pinkfish" };

const roomData = {
  Map: { title: "Club Map", cls: "map", sub: "Click a building or use the room buttons." },
  HQ: { title: "Penguin HQ", cls: "hq", sub: "The official headquarters of the council." },
  Cafe: { title: "Gossip Café", cls: "cafe", sub: "Coffee, chaos and over-analysis." },
  Mall: { title: "Glitter Mall", cls: "mall", sub: "Spend coins on fake but important items." },
  Fortune: { title: "Fortune Tent", cls: "fortune", sub: "The crystal ball has opinions." },
  Hall: { title: "Hall of Fame", cls: "hall", sub: "Awards nobody asked for." },
  Times: { title: "Penguin Times", cls: "times", sub: "Breaking news from the club." }
};

const shopItems = {
  bow: { name: "Pink Bow", emoji: "🎀", price: 25 },
  crown: { name: "Tiny Crown", emoji: "👑", price: 50 },
  glasses: { name: "Drama Glasses", emoji: "🕶️", price: 35 },
  fishhat: { name: "Fish Hat", emoji: "🐟", price: 100 }
};

const fortunes = [
  "The council says: absolutely not.",
  "A glittery plot twist is coming.",
  "The fish knows the answer but refuses to speak.",
  "Someone is acting normal. Suspicious.",
  "Career first. Chaos after dinner.",
  "You are entering your iconic era."
];

const headlines = [
  "Y creates another website. Experts worried.",
  "A denies all allegations after café incident.",
  "N requests a formal review of everyone's behaviour.",
  "Sacred Fish spotted in HQ. Economy shaken.",
  "Council declares today a Delusion Holiday.",
  "Pink Penguin Club accused of being too iconic."
];

let selectedMember = "A";
let currentMember = null;
let currentRoom = "HQ";
let me = { x: 50, y: 50 };
let members = {};
let presence = {};
let allMessages = [];
let lastPresenceWrite = 0;
let keysReady = false;

const loginScreen = document.getElementById("loginScreen");
const clubScreen = document.getElementById("clubScreen");
const roomStage = document.getElementById("roomStage");
const roomDecor = document.getElementById("roomDecor");
const livePenguins = document.getElementById("livePenguins");
const roomPanel = document.getElementById("roomPanel");

document.querySelectorAll(".member-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedMember = btn.dataset.member;
    document.querySelectorAll(".member-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("codeInput").addEventListener("keydown", e => {
  if(e.key === "Enter") login();
});

async function login(){
  const code = document.getElementById("codeInput").value.trim();
  if(codes[selectedMember] !== code){
    document.getElementById("loginMsg").textContent = "Wrong penguin code. Council denied entry.";
    return;
  }

  currentMember = selectedMember;
  loginScreen.classList.remove("active");
  clubScreen.classList.add("active");
  document.getElementById("statusLine").textContent = `Logged in as Penguin ${currentMember}`;

  await ensureMemberDoc(currentMember);
  await setDoc(doc(db, "presence", currentMember), {
    room: currentRoom,
    x: me.x,
    y: me.y,
    online: true
  }, { merge: true });

  setupListeners();
  changeRoom("HQ");
  setupMovementOnce();
}

async function ensureMemberDoc(id){
  const ref = doc(db, "members", id);
  const snap = await getDoc(ref);
  const fallback = {
    xp: 0,
    level: 1,
    coins: 100,
    title: "Founding Penguin",
    inventory: [],
    wearing: ""
  };

  if(!snap.exists()){
    await setDoc(ref, fallback);
  }else{
    await setDoc(ref, fallback, { merge: true });
  }
}

function setupListeners(){
  onSnapshot(collection(db, "members"), snap => {
    members = {};
    snap.forEach(d => members[d.id] = d.data());
    updateStats();
    renderLeaderboard();
    renderPenguins();
    renderRoomPanel();
  });

  onSnapshot(collection(db, "presence"), snap => {
    presence = {};
    snap.forEach(d => presence[d.id] = d.data());
    renderPenguins();
  });

  onSnapshot(collection(db, "messages"), snap => {
    allMessages = [];
    snap.forEach(d => allMessages.push({ id: d.id, ...d.data() }));
    renderMessages();
  });
}

function updateStats(){
  if(!currentMember || !members[currentMember]) return;
  const m = members[currentMember];
  document.getElementById("levelText").textContent = m.level ?? 1;
  document.getElementById("xpText").textContent = m.xp ?? 0;
  document.getElementById("coinsText").textContent = m.coins ?? 0;
  document.getElementById("wearingText").textContent = m.wearing ? shopItems[m.wearing]?.emoji || m.wearing : "none";
}

function renderLeaderboard(){
  const box = document.getElementById("leaderboard");
  const rows = Object.entries(members).sort((a,b) => (b[1].xp || 0) - (a[1].xp || 0));
  box.innerHTML = rows.map(([id,m]) => `
    <div class="row">
      <b>🐧 ${id}</b>
      <span>Lv ${m.level || 1} • ${m.xp || 0} XP • 🪙 ${m.coins || 0}</span>
    </div>
  `).join("");
}

function changeRoom(room){
  currentRoom = room;
  const data = roomData[room];
  document.getElementById("roomTitle").textContent = data.title;
  document.getElementById("roomSub").textContent = data.sub;
  roomStage.className = `stage ${data.cls}`;
  me = { x: 50, y: 70 };
  updatePresenceNow();
  renderDecor();
  renderPenguins();
  renderMessages();
  renderRoomPanel();
}

document.querySelectorAll(".roomNav").forEach(btn => {
  btn.addEventListener("click", () => changeRoom(btn.dataset.room));
});

document.getElementById("mapBtn").addEventListener("click", () => changeRoom("Map"));

function renderDecor(){
  if(currentRoom === "Map"){
    roomDecor.innerHTML = `
      <div class="building" style="position:absolute;left:8%;top:10%" data-go="Cafe"><div class="emoji">☕</div>Café</div>
      <div class="building" style="position:absolute;left:39%;top:7%" data-go="HQ"><div class="emoji">🏠</div>HQ</div>
      <div class="building" style="position:absolute;right:8%;top:13%" data-go="Mall"><div class="emoji">🎀</div>Mall</div>
      <div class="building" style="position:absolute;left:10%;bottom:12%" data-go="Fortune"><div class="emoji">🔮</div>Fortune</div>
      <div class="building" style="position:absolute;left:40%;bottom:7%" data-go="Hall"><div class="emoji">🏆</div>Hall</div>
      <div class="building" style="position:absolute;right:8%;bottom:14%" data-go="Times"><div class="emoji">📰</div>Times</div>
      <div class="decor" id="fishStatue" style="left:49%;top:45%;font-size:48px;cursor:pointer">🐟<br><small>Sacred Fish</small></div>
    `;
  }

  if(currentRoom === "HQ"){
    roomDecor.innerHTML = `
      <div class="decor" style="left:8%;top:16%;font-size:64px">🛋️<br><small>pink sofa</small></div>
      <div class="decor" style="right:8%;top:14%;font-size:58px">📌<br><small>notice board</small></div>
      <div class="decor" style="left:39%;top:10%;font-size:66px">🏛️<br><small>council desk</small></div>
      <div class="decor" id="fishStatue" style="left:47%;top:42%;font-size:50px;cursor:pointer">🐟<br><small>Sacred Fish</small></div>
    `;
  }

  if(currentRoom === "Cafe"){
    roomDecor.innerHTML = `
      <div class="decor" style="left:8%;top:13%;font-size:64px">☕<br><small>counter</small></div>
      <div class="decor" style="right:12%;top:14%;font-size:58px">🍰<br><small>cake case</small></div>
      <div class="decor" style="left:37%;top:34%;font-size:58px">🪑 🪑<br><small>gossip table</small></div>
    `;
  }

  if(currentRoom === "Mall"){
    roomDecor.innerHTML = `
      <div class="decor" style="left:8%;top:15%;font-size:62px">🎀<br><small>bows</small></div>
      <div class="decor" style="right:10%;top:14%;font-size:62px">👑<br><small>crowns</small></div>
      <div class="decor" style="left:41%;top:24%;font-size:62px">🛍️<br><small>shop desk</small></div>
    `;
  }

  if(currentRoom === "Fortune"){
    roomDecor.innerHTML = `
      <div class="decor" style="left:39%;top:20%;font-size:88px;color:white">🔮<br><small>crystal ball</small></div>
      <div class="decor" style="left:12%;top:18%;font-size:52px;color:white">🕯️</div>
      <div class="decor" style="right:12%;top:18%;font-size:52px;color:white">🕯️</div>
    `;
  }

  if(currentRoom === "Hall"){
    roomDecor.innerHTML = `
      <div class="decor" style="left:12%;top:18%;font-size:62px">🏆<br><small>awards</small></div>
      <div class="decor" style="left:42%;top:13%;font-size:74px">👑<br><small>legend wall</small></div>
      <div class="decor" style="right:12%;top:18%;font-size:62px">🎖️<br><small>badges</small></div>
    `;
  }

  if(currentRoom === "Times"){
    roomDecor.innerHTML = `
      <div class="decor" style="left:12%;top:16%;font-size:70px">🗞️<br><small>press desk</small></div>
      <div class="decor" style="right:12%;top:17%;font-size:60px">📸<br><small>paparazzi</small></div>
      <div class="decor" style="left:40%;top:35%;font-size:56px">📰<br><small>breaking news</small></div>
    `;
  }

  document.querySelectorAll("[data-go]").forEach(el => {
    el.addEventListener("click", () => changeRoom(el.dataset.go));
  });

  const fish = document.getElementById("fishStatue");
  if(fish) fish.addEventListener("click", claimFish);
}

function renderPenguins(){
  if(!currentMember) return;
  const ids = ["A","N","Y"];
  livePenguins.innerHTML = ids.map(id => {
    const p = presence[id] || { room: "HQ", x: 50, y: 70, online: false };
    const m = members[id] || {};
    const visible = p.room === currentRoom;
    if(!visible && currentRoom !== "Map") return "";
    const x = currentRoom === "Map" && p.room !== "Map" ? mapRoomX(p.room).x : p.x;
    const y = currentRoom === "Map" && p.room !== "Map" ? mapRoomX(p.room).y : p.y;
    const item = m.wearing ? (shopItems[m.wearing]?.emoji || "") : "";
    return `
      <div class="avatar ${id === currentMember ? "me" : ""} ${p.online ? "" : "offline"}"
           style="left:${x || 50}%;top:${y || 70}%">
        <div class="hat">${item}</div>
        <div class="penguin">🐧</div>
        <div class="label">${id}</div>
      </div>
    `;
  }).join("");
}

function mapRoomX(room){
  const points = {
    Cafe: {x:18,y:23}, HQ:{x:49,y:20}, Mall:{x:80,y:25},
    Fortune:{x:19,y:77}, Hall:{x:50,y:80}, Times:{x:81,y:77}, Map:{x:50,y:65}
  };
  return points[room] || {x:50,y:65};
}

function setupMovementOnce(){
  if(keysReady) return;
  keysReady = true;
  document.addEventListener("keydown", e => {
    if(!currentMember || !["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","W","A","S","D"].includes(e.key)) return;
    e.preventDefault();
    const speed = 2.3;
    if(e.key === "ArrowUp" || e.key.toLowerCase() === "w") me.y -= speed;
    if(e.key === "ArrowDown" || e.key.toLowerCase() === "s") me.y += speed;
    if(e.key === "ArrowLeft" || e.key.toLowerCase() === "a") me.x -= speed;
    if(e.key === "ArrowRight" || e.key.toLowerCase() === "d") me.x += speed;
    me.x = Math.max(5, Math.min(95, me.x));
    me.y = Math.max(10, Math.min(92, me.y));
    renderPenguins();
    writePresenceThrottled();
  });
}

function writePresenceThrottled(){
  const now = Date.now();
  if(now - lastPresenceWrite < 350) return;
  lastPresenceWrite = now;
  updatePresenceNow();
}

async function updatePresenceNow(){
  if(!currentMember) return;
  await setDoc(doc(db, "presence", currentMember), {
    room: currentRoom,
    x: Math.round(me.x),
    y: Math.round(me.y),
    online: true
  }, { merge: true });
}

window.addEventListener("beforeunload", () => {
  if(currentMember){
    setDoc(doc(db, "presence", currentMember), { online: false }, { merge: true });
  }
});

function renderMessages(){
  const box = document.getElementById("messagesBox");
  if(!box) return;
  const msgs = allMessages
    .filter(m => !m.room || m.room === currentRoom)
    .sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0))
    .slice(-20);

  box.innerHTML = msgs.map(m => `
    <div class="chat">
      <small>${m.room || ""}</small>
      <b>${escapeHtml(m.from || "Anon")}:</b>
      <div>${escapeHtml(m.text || "")}</div>
    </div>
  `).join("") || `<p class="tiny">No messages here yet.</p>`;
  box.scrollTop = box.scrollHeight;
}

document.getElementById("sendMsgBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keydown", e => {
  if(e.key === "Enter") sendMessage();
});

async function sendMessage(){
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if(!text) return;
  input.value = "";
  await addDoc(collection(db, "messages"), {
    from: currentMember,
    text,
    room: currentRoom,
    createdAt: Date.now()
  });
  await addXP(2);
}

function renderRoomPanel(){
  if(!currentMember || !members[currentMember]) return;

  if(currentRoom === "Cafe"){
    roomPanel.innerHTML = `
      <p>Play Coffee Catch to earn coins.</p>
      <button class="small" id="coffeeBtn">Play Coffee Catch</button>
    `;
    document.getElementById("coffeeBtn").addEventListener("click", openCoffeeGame);
    return;
  }

  if(currentRoom === "Mall"){
    const inv = members[currentMember].inventory || [];
    roomPanel.innerHTML = `
      <p>Spend coins on outfits. Everyone can see what you wear.</p>
      <div class="shop-grid">
        ${Object.entries(shopItems).map(([key,item]) => `
          <div class="card-item">
            <div class="big">${item.emoji}</div>
            <div>${item.name}</div>
            <div>🪙 ${item.price}</div>
            <button class="small" data-buy="${key}">${inv.includes(key) ? "Wear" : "Buy"}</button>
          </div>
        `).join("")}
      </div>
    `;
    document.querySelectorAll("[data-buy]").forEach(btn => {
      btn.addEventListener("click", () => buyOrWear(btn.dataset.buy));
    });
    return;
  }

  if(currentRoom === "Fortune"){
    roomPanel.innerHTML = `
      <p id="fortuneText">${fortunes[Math.floor(Math.random()*fortunes.length)]}</p>
      <button class="small" id="fortuneBtn">Ask again</button>
    `;
    document.getElementById("fortuneBtn").addEventListener("click", async () => {
      document.getElementById("fortuneText").textContent = fortunes[Math.floor(Math.random()*fortunes.length)];
      await addXP(3);
    });
    return;
  }

  if(currentRoom === "Hall"){
    const richest = Object.entries(members).sort((a,b)=>(b[1].coins||0)-(a[1].coins||0))[0];
    const highest = Object.entries(members).sort((a,b)=>(b[1].level||0)-(a[1].level||0))[0];
    roomPanel.innerHTML = `
      <div class="award-grid">
        <div class="card-item">🏆 Highest Level<br>${highest ? highest[0] : "-"} </div>
        <div class="card-item">🪙 Richest Penguin<br>${richest ? richest[0] : "-"} </div>
        <div class="card-item">🐟 Sacred Fish<br>Under investigation</div>
      </div>
    `;
    return;
  }

  if(currentRoom === "Times"){
    roomPanel.innerHTML = `
      <p id="headline">${headlines[Math.floor(Math.random()*headlines.length)]}</p>
      <button class="small" id="headlineBtn">New headline</button>
    `;
    document.getElementById("headlineBtn").addEventListener("click", async () => {
      document.getElementById("headline").textContent = headlines[Math.floor(Math.random()*headlines.length)];
      await addXP(3);
    });
    return;
  }

  if(currentRoom === "Map"){
    roomPanel.innerHTML = `<p>Click any building to enter that room. Penguins show where everyone currently is.</p>`;
    return;
  }

  roomPanel.innerHTML = `
    <p>Welcome to HQ. The council is always watching.</p>
    <button class="small" id="hqXP">Claim HQ paperwork XP</button>
  `;
  document.getElementById("hqXP").addEventListener("click", () => addXP(5));
}

async function buyOrWear(key){
  const m = members[currentMember];
  const item = shopItems[key];
  const inv = m.inventory || [];

  if(inv.includes(key)){
    await updateDoc(doc(db, "members", currentMember), { wearing: key });
    return;
  }

  if((m.coins || 0) < item.price){
    alert("Not enough coins, penguin.");
    return;
  }

  await updateDoc(doc(db, "members", currentMember), {
    coins: increment(-item.price),
    inventory: [...inv, key],
    wearing: key
  });
}

async function addXP(amount){
  const ref = doc(db, "members", currentMember);
  const m = members[currentMember] || {};
  const newXP = (m.xp || 0) + amount;
  const newLevel = Math.floor(newXP / 100) + 1;
  await updateDoc(ref, {
    xp: increment(amount),
    level: newLevel
  });
}

async function addCoins(amount){
  await updateDoc(doc(db, "members", currentMember), {
    coins: increment(amount)
  });
}

async function claimFish(){
  const key = "fishFound";
  const m = members[currentMember] || {};
  if(m[key]){
    alert("The Sacred Fish remembers you.");
    return;
  }
  await updateDoc(doc(db, "members", currentMember), {
    [key]: true,
    xp: increment(50),
    coins: increment(25)
  });
  alert("SECRET ACHIEVEMENT: Sacred Fish Guardian. +50 XP and +25 coins.");
}

function openModal(title, body){
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = body;
  document.getElementById("modal").classList.remove("hidden");
}

document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});

function openCoffeeGame(){
  openModal("Coffee Catch", `
    <p>Move with left/right arrow keys. Catch coffees. Avoid nothing because this is Alpha.</p>
    <div class="game-area" id="coffeeArea">
      <div class="catcher" id="catcher">🧺</div>
    </div>
    <p><b>Score:</b> <span id="coffeeScore">0</span> | <b>Time:</b> <span id="coffeeTime">20</span>s</p>
    <button class="small" id="startCoffee">Start</button>
  `);

  document.getElementById("startCoffee").addEventListener("click", startCoffee);
}

function startCoffee(){
  const area = document.getElementById("coffeeArea");
  const catcher = document.getElementById("catcher");
  const scoreEl = document.getElementById("coffeeScore");
  const timeEl = document.getElementById("coffeeTime");
  let score = 0;
  let time = 20;
  let catcherX = 45;
  let active = true;
  let drops = [];

  const move = e => {
    if(!active) return;
    if(e.key === "ArrowLeft") catcherX -= 6;
    if(e.key === "ArrowRight") catcherX += 6;
    catcherX = Math.max(0, Math.min(88, catcherX));
    catcher.style.left = catcherX + "%";
  };

  document.addEventListener("keydown", move);

  const dropTimer = setInterval(() => {
    if(!active) return;
    const d = document.createElement("div");
    d.className = "falling";
    d.textContent = Math.random() > .18 ? "☕" : "🧋";
    d.style.left = Math.random() * 88 + "%";
    d.style.top = "-40px";
    area.appendChild(d);
    drops.push({ el: d, y: -40, x: parseFloat(d.style.left) });
  }, 650);

  const gameTimer = setInterval(() => {
    drops.forEach(obj => {
      obj.y += 4;
      obj.el.style.top = obj.y + "px";

      if(obj.y > 280 && obj.y < 340 && Math.abs(obj.x - catcherX) < 11 && !obj.caught){
        obj.caught = true;
        score++;
        scoreEl.textContent = score;
        obj.el.remove();
      }

      if(obj.y > 390) obj.el.remove();
    });
    drops = drops.filter(o => !o.caught && o.y <= 390);
  }, 40);

  const clock = setInterval(async () => {
    time--;
    timeEl.textContent = time;
    if(time <= 0){
      active = false;
      clearInterval(dropTimer);
      clearInterval(gameTimer);
      clearInterval(clock);
      document.removeEventListener("keydown", move);

      const coins = score * 3;
      const xp = Math.max(5, score);
      await addCoins(coins);
      await addXP(xp);
      alert(`Coffee Catch complete. Score ${score}. You earned ${coins} coins and ${xp} XP.`);
    }
  }, 1000);
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[s]));
}
