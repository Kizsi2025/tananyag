/* ----------------------------------------------------------
   script.js – Retro-gyár tananyag – végleges, hibamentes verzió
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () =>  {
  let innovationPoints = 60;
  const ipDisplay    = document.getElementById('ip-display');
  const mainContent  = document.getElementById('main-content');

  /* ---------- AUTH-ELEMEK ---------- */
  const authContainer  = document.querySelector('.auth-container');
  const loginForm      = document.querySelector('.login-box');
  const signupForm     = document.querySelector('.signup-box');
  const loginHeaderBtn = document.getElementById('login-header-btn');
  const logoutBtn      = document.getElementById('logout-btn');
  const userNameSpan   = document.getElementById('user-name');

  /* ---------- SEGÉDFÜGGVÉNYEK ---------- */
  const updateIPDisplay = () => ipDisplay && (ipDisplay.textContent = innovationPoints);

  const addIP = n => { innovationPoints += n; updateIPDisplay(); };
  const spendIP = n => {
    if (innovationPoints >= n) { innovationPoints -= n; updateIPDisplay(); return true; }
    alert('Nincs elég Innovációs Pontod!'); return false;
  };

  const showUserName = n => userNameSpan &&
    (userNameSpan.textContent = `Üdv, ${n}!`, userNameSpan.classList.remove('hidden'));

  const showMain = () => {
    mainContent?.classList.remove('hidden');
    loginHeaderBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
    authContainer?.classList.add('hidden');
  };

  const hideMain = () => {
    mainContent?.classList.add('hidden');
    loginHeaderBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    if (userNameSpan) { userNameSpan.textContent = ''; userNameSpan.classList.add('hidden'); }
    authContainer?.classList.add('hidden');
  };

  /* ---------- AUTO-LOGIN ---------- */
  const token = localStorage.getItem('authToken');
  const name  = localStorage.getItem('userName');
  if (token && name) {
    fetch('/api/auth/profile', { headers:{Authorization:`Bearer ${token}`} })
      .then(r => r.ok ? (showMain(), showUserName(name)) : localStorage.clear())
      .catch(() => localStorage.clear());
  }

  /* ---------- LOGIN PANEL ---------- */
  loginHeaderBtn?.addEventListener('click', () => authContainer?.classList.remove('hidden'));
  authContainer?.addEventListener('click', e => e.target === authContainer && authContainer.classList.add('hidden'));

  /* váltás login / signup */
  document.querySelector('.login-btn') ?.addEventListener('click', e => {
    e.preventDefault(); loginForm.classList.remove('hidden'); signupForm.classList.add('hidden');
  });
  document.querySelector('.signup-btn')?.addEventListener('click', e => {
    e.preventDefault(); signupForm.classList.remove('hidden'); loginForm.classList.add('hidden');
  });

  /* ---------- LOGIN ---------- */
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const [email,password] = [loginForm.elements[0].value, loginForm.elements[1].value];
    try {
      const r = await fetch('/api/auth/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      if (!r.ok) { alert('Hibás adatok!'); return; }
      const {token:userToken,user} = await r.json();
      localStorage.setItem('authToken', userToken);
      localStorage.setItem('userName',  user.name);
      showMain(); showUserName(user.name); loginForm.reset();
    } catch { alert('Hálózati hiba!'); }
  });

  /* ---------- SIGN-UP ---------- */
  signupForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const [nameInput,email,password,pw2] = [...signupForm.elements].map(el=>el.value);
    if (password !== pw2) { alert('A jelszavak nem egyeznek!'); return; }
    try {
      const r = await fetch('/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:nameInput,email,password})});
      if (!r.ok) { alert('Regisztrációs hiba!'); return; }
      const {token:userToken,user} = await r.json();
      localStorage.setItem('authToken', userToken);
      localStorage.setItem('userName',  user.name);
      showMain(); showUserName(user.name); signupForm.reset();
    } catch { alert('Hálózati hiba!'); }
  });

  /* ---------- LOGOUT ---------- */
  logoutBtn?.addEventListener('click', () => { localStorage.clear(); hideMain(); });

  /* ---------- TARTALOM FELOLDÁS ---------- */
  document.querySelectorAll('.unlock-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!spendIP(+btn.dataset.cost)) return;

      /* osztály-alapú feloldás (data-topic) */
      const topic = btn.dataset.topic;
      if (topic)
        document.querySelectorAll(`.session.${topic}`).forEach(sec => sec.classList.remove('hidden'));

      /* többszörös ID-lista (data-target="id1,id2") */
      (btn.dataset.target?.split(',') || []).forEach(id => {
        document.getElementById(id.trim())?.classList.remove('hidden');
      });

      btn.disabled = true;
      btn.textContent = 'Feloldva';
      btn.style.cssText = 'background:#95a5a6;cursor:not-allowed';
    })
  );

  /* ---------- KVÍZEK (mintapélda az elsőre) ---------- */
  const quizBtn = document.getElementById('quiz-submit-btn');
  quizBtn?.addEventListener('click', () => {
    const correct = {q1:'b',q2:'b'};
    const form = document.getElementById('quizForm');
    let score = 0;
    for (const k in correct)
      if (form.elements[k]?.value === correct[k]) score++;
    addIP(score*5);
    const res = document.getElementById('quizResult');
    res.classList.remove('hidden'); res.textContent = `Találatok: ${score}/2 | +${score*5} IP`;
    quizBtn.disabled = true; quizBtn.style.background='#95a5a6';
  });

  /* ---------- AI PITCH (rövidített) ---------- */
  const pitchBtn = document.getElementById('submit-pitch-btn');
  pitchBtn?.addEventListener('click', async () => {
    const txt = document.getElementById('pitch-text').value.trim();
    if (!txt) { alert('Írj be szöveget!'); return; }
    const stat = document.getElementById('pitch-status');
    stat.textContent = 'Értékelés folyamatban…'; stat.style.color='#f39c12';
    pitchBtn.disabled = true;
    try {
      const headers = {'Content-Type':'application/json'};
      const t = localStorage.getItem('authToken'); if (t) headers.Authorization = `Bearer ${t}`;
      const r = await fetch(t?'/evaluate':'/evaluate-public',{method:'POST',headers,body:JSON.stringify({prompt:txt})});
      if (!r.ok) throw new Error('Hiba az értékelésnél');
      const {result} = await r.json();
      stat.innerHTML = `<strong>AI értékelés:</strong><br>${result.replace(/\n/g,'<br>')}`;
      stat.style.color='#27ae60'; addIP(10);
    } catch(e){ stat.textContent=`Hiba: ${e.message}`; stat.style.color='#e74c3c'; }
    pitchBtn.disabled = false;
  });

  /* ---------- KEZDŐ ÁLLAPOT ---------- */
  updateIPDisplay();
});
