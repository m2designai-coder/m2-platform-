// Ключи из config.js (если config.js загружен раньше — используем его значения)
if (typeof JB_KEY === 'undefined') var JB_KEY = '';
if (typeof JB_BIN === 'undefined') var JB_BIN = '';
var USERS_CACHE = [
  { email: 'm2.designai@gmail.com', pass: 'M2admin2024', name: 'Максим', role: 'admin' }
];
var CLIENTS = [
  { name: 'Надежда Бейнер', av: 'НБ', status: 'active', preview: 'Нравится столешница', time: '10:09', projects: [{ name: 'Квартира 3к · Москва', progress: 65 }, { name: 'Офис на Тверской', progress: 90 }] },
  { name: 'Дмитрий Неронов', av: 'ДН', status: 'new', preview: 'Добрый день!', time: 'вчера', projects: [{ name: 'Квартира · Владимир', progress: 30 }] },
  { name: 'Анна Козлова', av: 'АК', status: 'done', preview: 'Спасибо, всё отлично!', time: 'пн', projects: [{ name: 'Загородный дом', progress: 100 }] }
];
var MSGS = [
  { from: 'client', text: 'Добрый день! Рада начать работу.', time: '10:02' },
  { from: 'designer', text: 'Добрый день! Изучила анкету.', time: '10:04' },
  { from: 'client', text: 'Конечно, спрашивайте!', time: '10:04' },
  { from: 'client', text: 'Вот референс кухни', time: '10:06', img: 'kitchen.jpg' },
  { from: 'designer', text: 'Прекрасный выбор. Цвет или форма?', time: '10:07' },
  { from: 'client', text: 'Нравится столешница и лёгкость.', time: '10:09' }
];
var TZ = [
  { k: 'ОСНОВНОЙ СТИЛЬ', v: 'Скандинавский минимализм', s: 'ok' },
  { k: 'КУХНЯ · ФАСАДЫ', v: 'Белый МДФ, без ручек', s: 'ok' },
  { k: 'НАПОЛЬНОЕ ПОКРЫТИЕ', v: 'Паркетная доска, светлая', s: 'ok' },
  { k: 'ОСВЕЩЕНИЕ', v: 'Споты + декоративные подвесы', s: 'ok' },
  { k: 'СТОЛЕШНИЦА', v: 'Уточняется в диалоге', s: 'pending' },
  { k: 'БЮДЖЕТ КУХНИ', v: 'Не указан', s: 'missing' }
];
var HINTS = [
  { type: 'ПРОТИВОРЕЧИЕ', text: 'В анкете классические карнизы, но референсы — минимализм.', p: 'high' },
  { type: 'СПРОСИТЬ', text: 'Бюджет кухонного гарнитура не обсуждался.', p: 'high', btn: true },
  { type: 'ИНСАЙТ', text: 'Клиент дважды сказал «лёгкость».', p: 'med' },
  { type: 'ДЕЙСТВИЕ', text: 'Отправьте референс столешниц.', p: 'low' }
];
var PROFILE = [['Стиль','Скандинавский'],['Бюджет','Средний'],['Объект','3к · Москва'],['Семья','2 + ребёнок'],['Фокус','Свет и хранение']];
var KUB_Q = [
  { q: 'Как вас зовут?', h: 'Имя и удобное обращение', t: 'text' },
  { q: 'Расскажите об объекте?', h: 'Тип и примерная площадь', t: 'text' },
  { q: 'Как выглядел бы идеальный результат?', h: 'Опишите своими словами', t: 'area' },
  { q: 'Есть ли интерьеры которые нравятся?', h: 'Пришлите 2-3 фото', t: 'file' }
];
var msgs = MSGS.slice();
var activeClient = 0;
var activeProject = 0;
var kubStep = 0;
var aiTab = 'ai';

function g(id) { return document.getElementById(id); }

function showMsg(txt, isErr) {
  var el = g('auth-msg');
  el.textContent = txt;
  el.style.display = 'block';
  el.style.color = isErr ? 'var(--err)' : 'var(--ok)';
  el.style.background = isErr ? '#fdf2f2' : '#f0f5f0';
}

function showLogin() {
  g('tab-login').classList.add('active');
  g('tab-reg').classList.remove('active');
  g('login-form').style.display = 'block';
  g('register-form').style.display = 'none';
}

function showRegister() {
  g('tab-reg').classList.add('active');
  g('tab-login').classList.remove('active');
  g('register-form').style.display = 'block';
  g('login-form').style.display = 'none';
}

function jbHeaders() {
  return { 'Content-Type': 'application/json', 'X-Master-Key': JB_KEY };
}

function loadUsers(cb) {
  console.log('loadUsers called, JB_KEY exists:', !!JB_KEY, 'JB_BIN:', JB_BIN);
  if (!JB_BIN || !JB_KEY || JB_KEY === 'ВСТАВЬ_КЛЮЧ_JSONBIN_СЮДА') { 
    console.log('using local cache');
    cb(USERS_CACHE); return; 
  }
  var done = false;
  var timer = setTimeout(function() {
    if (!done) { done = true; console.log('JSONBin timeout - using cache'); cb(USERS_CACHE); }
  }, 1500);
  fetch('https://api.jsonbin.io/v3/b/' + JB_BIN + '/latest', { headers: jbHeaders() })
    .then(function(r) { console.log('JSONBin status:', r.status); return r.json(); })
    .then(function(d) {
      if (!done) { done = true; clearTimeout(timer); 
        console.log('JSONBin response:', JSON.stringify(d).slice(0,100));
        if (d.record && d.record.users) USERS_CACHE = d.record.users; 
        cb(USERS_CACHE); }
    })
    .catch(function(e) { 
      if (!done) { done = true; clearTimeout(timer); console.log('JSONBin error:', e); cb(USERS_CACHE); } 
    });
}

function saveUsers(users, cb) {
  if (!JB_KEY || JB_KEY === 'ВСТАВЬ_КЛЮЧ_СЮДА' || JB_KEY === 'ВСТАВЬ_КЛЮЧ_JSONBIN_СЮДА') { if (cb) cb(); return; }
  if (!JB_BIN) {
    fetch('https://api.jsonbin.io/v3/b', {
      method: 'POST',
      headers: Object.assign({}, jbHeaders(), { 'X-Bin-Name': 'm2-users', 'X-Bin-Private': 'true' }),
      body: JSON.stringify({ users: users })
    }).then(function(r) { return r.json(); })
      .then(function(d) { if (d.metadata) JB_BIN = d.metadata.id; if (cb) cb(); })
      .catch(function() { if (cb) cb(); });
  } else {
    fetch('https://api.jsonbin.io/v3/b/' + JB_BIN, {
      method: 'PUT', headers: jbHeaders(), body: JSON.stringify({ users: users })
    }).then(function() { if (cb) cb(); }).catch(function() { if (cb) cb(); });
  }
}

function doLogin() {
  var email = g('login-email').value.trim();
  var pass = g('login-pass').value.trim();
  if (!email || !pass) { showMsg('Введите email и пароль', true); return; }
  showMsg('Входим...', false);
  loadUsers(function(users) {
    var user = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].pass === pass) { user = users[i]; break; }
    }
    if (!user) { showMsg('Неверный email или пароль', true); return; }
    initApp(user);
  });
}

function doRegister() {
  var email = g('reg-email').value.trim();
  var pass = g('reg-pass').value.trim();
  var name = g('reg-name').value.trim();
  if (!email || !pass || !name) { showMsg('Заполните все поля', true); return; }
  showMsg('Создаём аккаунт...', false);
  loadUsers(function(users) {
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === email) { showMsg('Email уже зарегистрирован', true); return; }
    }
    var newUser = { email: email, pass: pass, name: name, role: 'designer' };
    users.push(newUser);
    USERS_CACHE = users;
    saveUsers(users, function() { showMsg('Аккаунт создан! Войдите.', false); showLogin(); });
  });
}

function doLogout() {
  try { localStorage.removeItem('m2_user'); } catch(e) {}
  g('app').style.display = 'none';
  g('admin-btn').style.display = 'none';
  g('auth').style.display = 'flex';
  g('login-email').value = '';
  g('login-pass').value = '';
  showLogin();
}

function initApp(user) {
  console.log('initApp called, user:', user ? user.email : 'null');
  try { 
    localStorage.setItem('m2_user', JSON.stringify(user));
    console.log('saved to localStorage:', localStorage.getItem('m2_user'));
  } catch(e) { console.log('localStorage error:', e); }
  g('auth').style.display = 'none';
  g('app').style.display = 'flex';
  if (user.role === 'admin') g('admin-btn').style.display = 'block';
  g('user-avatar').textContent = user.name.slice(0, 2).toUpperCase();
  try { renderClients(); } catch(e) {}
  try { renderMsgs(); } catch(e) {}
  try { renderTZ(); } catch(e) {}
  try { renderAI(); } catch(e) {}
}

function renderClients() {
  var html = '';
  for (var ci = 0; ci < CLIENTS.length; ci++) {
    var c = CLIENTS[ci];
    html += '<div class="client-item' + (ci === activeClient ? ' active' : '') + '" data-ci="' + ci + '">';
    html += '<div class="client-row">';
    html += '<div class="av-sm serif">' + c.av + (c.status === 'new' ? '<div class="new-dot"></div>' : '') + '</div>';
    html += '<div class="client-info"><div class="client-name">' + c.name + '</div><div class="client-preview">' + c.preview + '</div></div>';
    html += '<div class="client-time">' + c.time + '</div></div></div>';
    if (ci === activeClient) {
      html += '<div class="projects-list">';
      for (var pi = 0; pi < c.projects.length; pi++) {
        var p = c.projects[pi];
        var fill = p.progress === 100 ? 'var(--ok)' : '#c4a882';
        html += '<div class="proj-item' + (pi === activeProject ? ' active' : '') + '" data-ci="' + ci + '" data-pi="' + pi + '">';
        html += '<div class="proj-name' + (pi === activeProject ? ' active' : '') + '">' + p.name + '</div>';
        html += '<div class="prog-bar"><div class="prog-fill" style="width:' + p.progress + '%;background:' + fill + '"></div></div></div>';
      }
      html += '</div>';
    }
  }
  var el = g('clients-list');
  el.innerHTML = html;
  var items = el.querySelectorAll('.client-item');
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function() {
      activeClient = parseInt(this.getAttribute('data-ci'));
      activeProject = 0;
      g('client-name').textContent = CLIENTS[activeClient].name;
      g('project-name').textContent = CLIENTS[activeClient].projects[0].name;
      renderClients();
    });
  }
  var projs = el.querySelectorAll('.proj-item');
  for (var j = 0; j < projs.length; j++) {
    projs[j].addEventListener('click', function(e) {
      e.stopPropagation();
      activeClient = parseInt(this.getAttribute('data-ci'));
      activeProject = parseInt(this.getAttribute('data-pi'));
      g('client-name').textContent = CLIENTS[activeClient].name;
      g('project-name').textContent = CLIENTS[activeClient].projects[activeProject].name;
      renderClients();
    });
  }
}

function renderMsgs() {
  var el = g('messages');
  if (!el) return;
  var html = '';
  for (var i = 0; i < msgs.length; i++) {
    var m = msgs[i];
    html += '<div class="msg' + (m.from === 'designer' ? ' right' : '') + '">';
    if (m.from === 'client') html += '<div class="msg-av serif">' + CLIENTS[activeClient].av + '</div>';
    html += '<div class="bubble' + (m.from === 'designer' ? ' mine' : '') + '">';
    if (m.img) html += '<div class="bubble-img">🖼 ' + m.img + '</div>';
    html += '<div class="bubble-text">' + m.text + '</div>';
    html += '<div class="bubble-time">' + m.time + '</div></div></div>';
  }
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

function sendMsg() {
  var inp = g('msg-input');
  if (!inp.value.trim()) return;
  msgs.push({ from: 'designer', text: inp.value, time: 'сейчас' });
  inp.value = '';
  renderMsgs();
}

function renderTZ() {
  var html = '';
  for (var i = 0; i < TZ.length; i++) {
    var t = TZ[i];
    var c = t.s === 'ok' ? 'var(--ok)' : t.s === 'pending' ? 'var(--warn)' : 'var(--err)';
    var ic = t.s === 'ok' ? '✓' : t.s === 'pending' ? '·' : '!';
    var bg = t.s === 'ok' ? '#f0f5f0' : t.s === 'pending' ? '#fdf8ee' : '#fdf2f2';
    html += '<div class="tz-row" style="border-left-color:' + c + '"><div><div class="tz-key">' + t.k + '</div><div class="tz-val' + (t.s === 'missing' ? ' missing' : '') + '">' + t.v + '</div></div>';
    html += '<div class="tz-status" style="color:' + c + ';border-color:' + c + ';background:' + bg + '">' + ic + '</div></div>';
  }
  var tzEl = g('tz-list'); if (tzEl) tzEl.innerHTML = html;
}

function renderAI() {
  var el = g('ai-body');
  if (!el) return;
  var html = '';
  if (aiTab === 'ai') {
    html = '<div class="ai-status"><div class="ai-dot"></div><span class="ai-lbl">АНАЛИЗИРУЕТ ДИАЛОГ</span></div>';
    for (var i = 0; i < HINTS.length; i++) {
      var h = HINTS[i];
      var c = h.p === 'high' ? 'var(--err)' : h.p === 'med' ? 'var(--warn)' : 'var(--light)';
      html += '<div class="hint" style="border-left:2.5px solid ' + c + '"><div class="hint-type" style="color:' + c + '">' + h.type + '</div><div class="hint-text">' + h.text + '</div>' + (h.btn ? '<button class="btn-use">ИСПОЛЬЗОВАТЬ →</button>' : '') + '</div>';
    }
  } else {
    html = '<div class="profile-card"><div class="profile-title">ПРОФИЛЬ КЛИЕНТА</div>';
    for (var j = 0; j < PROFILE.length; j++) {
      html += '<div class="profile-row"><span class="profile-key">' + PROFILE[j][0] + '</span><span class="profile-val">' + PROFILE[j][1] + '</span></div>';
    }
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderKub() {
  var q = KUB_Q[kubStep];
  g('kub-step-lbl').textContent = 'шаг ' + (kubStep + 1) + ' из ' + KUB_Q.length;
  g('kub-q').textContent = q.q;
  g('kub-hint').textContent = q.h;
  g('kub-back').style.display = kubStep > 0 ? 'flex' : 'none';
  g('kub-next').textContent = kubStep < KUB_Q.length - 1 ? 'ДАЛЕЕ' : 'ЗАВЕРШИТЬ';
  var prog = '';
  for (var i = 0; i < KUB_Q.length; i++) {
    prog += '<div style="height:2px;border-radius:1px;width:' + (i === kubStep ? 40 : 18) + 'px;background:' + (i < kubStep ? 'var(--ok)' : i === kubStep ? 'var(--accent)' : 'var(--border)') + '"></div>';
  }
  g('kub-progress').innerHTML = prog;
  var area = g('kub-input');
  if (q.t === 'file') {
    area.innerHTML = '<div class="kub-upload"><div style="font-size:22px;color:#c4a882;margin-bottom:8px">↑</div><div style="font-size:13px;color:var(--mid)">Нажмите для загрузки фото</div></div>';
  } else if (q.t === 'area') {
    area.innerHTML = '<textarea class="kub-textarea" placeholder="Опишите своими словами..."></textarea>';
  } else {
    area.innerHTML = '<input class="field-input" style="margin-bottom:0" placeholder="Введите ответ...">';
  }
}

function bind(id, ev, fn) { var el = g(id); if (el) el.addEventListener(ev, fn); }

document.addEventListener('DOMContentLoaded', function() {
  bind('tab-login', 'click', showLogin);
  bind('tab-reg', 'click', showRegister);
  bind('btn-login', 'click', doLogin);
  bind('btn-reg', 'click', doRegister);
  bind('login-pass', 'keydown', function(e) { if (e.key === 'Enter') doLogin(); });
  bind('btn-send', 'click', sendMsg);
  bind('msg-input', 'keydown', function(e) { if (e.key === 'Enter') sendMsg(); });
  bind('tab-chat', 'click', function() {
    g('tab-chat').classList.add('active'); g('tab-tz').classList.remove('active');
    g('chat-panel').style.display = 'flex'; g('tz-panel').style.display = 'none';
  });
  bind('tab-tz', 'click', function() {
    g('tab-tz').classList.add('active'); g('tab-chat').classList.remove('active');
    g('tz-panel').style.display = 'block'; g('chat-panel').style.display = 'none';
  });
  bind('ai-tab-ai', 'click', function() {
    g('ai-tab-ai').classList.add('active'); g('ai-tab-profile').classList.remove('active');
    aiTab = 'ai'; renderAI();
  });
  bind('ai-tab-profile', 'click', function() {
    g('ai-tab-profile').classList.add('active'); g('ai-tab-ai').classList.remove('active');
    aiTab = 'profile'; renderAI();
  });
  bind('btn-new-client', 'click', function() {
    g('kub-overlay').style.display = 'flex'; kubStep = 0; renderKub();
  });
  bind('admin-btn', 'click', function() { g('admin-overlay').style.display = 'block'; });
  bind('btn-close-admin', 'click', function() { g('admin-overlay').style.display = 'none'; });
  bind('kub-next', 'click', function() {
    if (kubStep < KUB_Q.length - 1) { kubStep++; renderKub(); }
    else { g('kub-overlay').style.display = 'none'; }
  });
  bind('kub-back', 'click', function() { if (kubStep > 0) { kubStep--; renderKub(); } });
  bind('btn-logout', 'click', doLogout);

  // Автовход если сессия сохранена
  try {
    var saved = localStorage.getItem('m2_user');
    if (saved) {
      var u = JSON.parse(saved);
      if (u && u.email) {
        initApp(u);
        return;
      }
    }
  } catch(e) {}
});