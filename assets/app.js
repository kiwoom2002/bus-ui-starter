/* 프런트 전용 – localStorage 사용(백엔드/SQL 없이 동작) */

function formatWon(n){ return (n||0).toLocaleString('ko-KR') + '원'; }

const App = {
  state: {
    routes: [
      {id:1, name:"구미 → 한서대", type:"등교", depart:"07:40", capacity:40, remaining:12, fare:8000},
      {id:2, name:"한서대 → 구미", type:"하교", depart:"18:10", capacity:40, remaining:8,  fare:8000},
      {id:3, name:"대전 → 한서대", type:"등교", depart:"08:20", capacity:30, remaining:5,  fare:8000},
      {id:4, name:"한서대 → 대전", type:"하교", depart:"18:30", capacity:30, remaining:11, fare:8000},
      {id:5, name:"천안 → 한서대", type:"등교", depart:"08:00", capacity:28, remaining:6,  fare:8000},
    ],
  },

  /* 페이지 초기화 */
  page(which){
    this.guard();
    this.initNav();
    if(which==='home') this.renderFavs();
    if(which==='routes') this.renderRoutes();
    if(which==='reservation') this.initReservation();
    if(which==='my') this.renderMy();
  },

  /* 로그인 보호/리다이렉트 */
  guard(){
    const u = this.me();
    const path = location.pathname.split('/').pop();
    if(!u && path!=='index.html' && path!==''){
      location.href = 'index.html';
    }
    if(u && (path==='index.html' || path==='')){
      location.href = 'home.html';
    }
  },

  /* 로그인/로그아웃/세션 */
  me(){
    try { return JSON.parse(localStorage.getItem('user')); } catch(e){ return null; }
  },
  login(e){
    e.preventDefault();
    const id = document.getElementById('userId').value.trim();
    const pw = document.getElementById('userPw').value.trim();
    if(!id || !pw){ alert('아이디/비밀번호를 입력하세요'); return false; }
    localStorage.setItem('user', JSON.stringify({id, name:`사용자${id.slice(-2)}`}));
    if(!localStorage.getItem('favorites')) localStorage.setItem('favorites', JSON.stringify([]));
    if(!localStorage.getItem('reservations')) localStorage.setItem('reservations', JSON.stringify([]));
    location.href = 'home.html';
    return false;
  },
  logout(){
    localStorage.removeItem('user');
    location.href = 'index.html';
  },
  initNav(){
    const u = this.me();
    const el = document.getElementById('navUser');
    if(el && u) el.textContent = `${u.name} 님 환영합니다`;
  },

  /* 즐겨찾기 */
  getFavs(){ try { return JSON.parse(localStorage.getItem('favorites'))||[]; } catch(e){ return []; } },
  setFavs(arr){ localStorage.setItem('favorites', JSON.stringify(arr)); },

  renderFavs(){
    const favList = document.getElementById('favList');
    const favIds = this.getFavs();
    const items = this.state.routes.filter(r=>favIds.includes(r.id));
    favList.innerHTML = items.length? '' : '<p class="text-secondary">즐겨찾기가 없습니다. 우측 상단의 “노선 추가” 버튼을 눌러 등록하세요.</p>';
    items.forEach(r=>{
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h5 class="card-title h6">${r.name}</h5>
            <span class="badge ${r.type==='등교'?'text-bg-primary':'text-bg-secondary'}">${r.type}</span>
          </div>
          <p class="mb-1 text-secondary">출발: ${r.depart}</p>
          <p class="mb-1">요금: <strong>${formatWon(r.fare)}</strong></p>
          <span class="badge text-bg-light badge-seat">좌석 ${r.remaining}/${r.capacity}</span>
          <div class="d-flex gap-2 mt-3">
            <a class="btn btn-primary btn-sm" href="reservation.html?route=${r.id}">날짜 선택</a>
            <button class="btn btn-outline-danger btn-sm" onclick="App.toggleFav(${r.id})">즐겨찾기 해제</button>
          </div>
        </div>
      </div>`;
      favList.appendChild(col);
    });

    const todayInfo = document.getElementById('todayInfo');
    if(todayInfo){
      const today = new Date().toISOString().slice(0,10);
      const resv = this.getReservations().filter(r=>r.date === today);
      todayInfo.textContent = resv.length? `오늘 예약: ${resv.length}건` : '오늘 예약이 없습니다.';
    }
  },

  renderRoutes(){
    const type = document.getElementById('selType')?.value || '';
    const q = (document.getElementById('search')?.value || '').trim();
    let list = this.state.routes.slice();
    if(type) list = list.filter(r=>r.type===type);
    if(q) list = list.filter(r=>r.name.includes(q));
    const favIds = this.getFavs();

    const tbody = document.getElementById('routeTbody');
    tbody.innerHTML = '';
    list.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="width:110px">
          <button class="btn btn-sm ${favIds.includes(r.id)?'btn-warning':'btn-outline-warning'}" onclick="App.toggleFav(${r.id})">
            ★ 즐겨찾기
          </button>
        </td>
        <td>${r.name}</td>
        <td><span class="badge ${r.type==='등교'?'text-bg-primary':'text-bg-secondary'}">${r.type}</span></td>
        <td>${r.depart}</td>
        <td><span class="badge text-bg-light">${r.remaining}/${r.capacity}</span></td>
        <td>${formatWon(r.fare)}</td>
        <td class="text-end">
          <a class="btn btn-primary btn-sm" href="reservation.html?route=${r.id}">예약</a>
        </td>`;
      tbody.appendChild(tr);
    });
  },

  toggleFav(id){
    const favs = this.getFavs();
    const i = favs.indexOf(id);
    if(i===-1) favs.push(id); else favs.splice(i,1);
    this.setFavs(favs);
    const path = location.pathname.split('/').pop();
    if(path==='routes.html') this.renderRoutes();
    if(path==='home.html') this.renderFavs();
  },

  /* 예약 */
  parseQuery(){
    const q = new URLSearchParams(location.search);
    return Object.fromEntries(q.entries());
  },

  initReservation(){
    const {route} = this.parseQuery();
    const r = this.state.routes.find(x=>String(x.id)===String(route));
    const title = document.getElementById('resvTitle');
    if(r && title) title.textContent = `예약 - ${r.name} (${r.type}, 출발 ${r.depart})`;

    const inputDate = document.getElementById('resvDate');
    if(inputDate){
      const today = new Date().toISOString().slice(0,10);
      inputDate.value = today;
      inputDate.min = today;
    }

    // 요금/총금액 안내
    const fareInfo = document.getElementById('fareInfo');
    const cntEl = document.getElementById('resvCount');
    const updateFare = ()=>{
      const cnt = Number(cntEl.value || 1);
      if(r && fareInfo) fareInfo.textContent = `1인 요금: ${formatWon(r.fare)} / 총 ${cnt}명 = ${formatWon(r.fare * cnt)}`;
    };
    cntEl.addEventListener('input', updateFare);
    updateFare();
  },

  getReservations(){ try { return JSON.parse(localStorage.getItem('reservations'))||[]; } catch(e){ return []; } },
  setReservations(arr){ localStorage.setItem('reservations', JSON.stringify(arr)); },

  makeReservation(){
    const {route} = this.parseQuery();
    const r = this.state.routes.find(x=>String(x.id)===String(route));
    const date = document.getElementById('resvDate').value;
    const cnt  = Number(document.getElementById('resvCount').value || 1);
    if(!r) return alert('노선 정보를 찾을 수 없습니다.');
    if(!date) return alert('날짜를 선택하세요.');

    const total = r.fare * cnt;
    const list = this.getReservations();
    list.push({id: Date.now(), routeId:r.id, name:r.name, type:r.type, date, count:cnt, fare:r.fare, total});
    this.setReservations(list);

    const alertBox = document.getElementById('resvAlert');
    alertBox.classList.remove('d-none');
    alertBox.innerHTML = `예약 완료: ${r.name} / ${date} / ${cnt}명<br>결제 예정 금액: <strong>${formatWon(total)}</strong>`;
    setTimeout(()=>{ location.href='my.html'; }, 800);
  },

  renderMy(){
    const tbody = document.getElementById('myTbody');
    const list = this.getReservations();
    tbody.innerHTML = '';
    let sum = 0;

    list.forEach((v,idx)=>{
      const eachTotal = v.total ?? (v.fare||0)*(v.count||1);
      sum += eachTotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${v.name}</td>
        <td><span class="badge ${v.type==='등교'?'text-bg-primary':'text-bg-secondary'}">${v.type}</span></td>
        <td>${v.date}</td>
        <td>${v.count}</td>
        <td>${formatWon(eachTotal)}</td>
        <td class="text-end">
          <button class="btn btn-outline-danger btn-sm" onclick="App.cancel(${v.id})">취소</button>
        </td>`;
      tbody.appendChild(tr);
    });

    const sumRow = document.getElementById('sumRow');
    if(sumRow) sumRow.textContent = `총 합계: ${formatWon(sum)}`;
  },

  cancel(id){
    const list = this.getReservations().filter(v=>v.id!==id);
    this.setReservations(list);
    this.renderMy();
  },
};

window.App = App;
