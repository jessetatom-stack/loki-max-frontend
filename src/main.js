
import './styles.css'

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'https://loki-web-engine-v2.onrender.com'

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL']
const state = {
  activeSport: 'NBA',
  health: 'checking',
  games: [],
  tickerGames: [],
  alerts: [
    'Live engine online',
    'Sprint 2 command feed active',
    'Favorites and account layer coming next',
  ],
  lastUpdated: null,
  profile: loadProfile(),
  loading: false,
  error: ''
}

const app = document.querySelector('#app')

function loadProfile() {
  try {
    const raw = localStorage.getItem('loki_max_profile')
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    displayName: 'Guest Operator',
    favoriteTeams: ['Lakers', 'Chiefs'],
    predictionStreak: 4,
    watchlistCount: 2
  }
}

function saveProfile() {
  localStorage.setItem('loki_max_profile', JSON.stringify(state.profile))
}

function formatTime(date) {
  if (!date) return '--'
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

function getTeamName(game, side) {
  const options = [
    game?.[side],
    game?.teams?.[side],
    game?.teams?.[side]?.name,
    game?.[side === 'home' ? 'homeTeam' : 'awayTeam'],
    game?.[side === 'home' ? 'home_team' : 'away_team'],
    game?.[side === 'home' ? 'team1' : 'team2'],
    game?.[side === 'home' ? 'competitor1' : 'competitor2']
  ]
  return options.find(Boolean) || (side === 'home' ? 'Home' : 'Away')
}

function getScore(game, side) {
  const options = [
    game?.[side + 'Score'],
    game?.[side === 'home' ? 'score1' : 'score2'],
    game?.scores?.[side],
    game?.teams?.[side]?.score,
    game?.[side === 'home' ? 'home_score' : 'away_score']
  ]
  const score = options.find((v) => v !== undefined && v !== null && v !== '')
  return score ?? '-'
}

function getStatus(game) {
  return (
    game?.status ||
    game?.state ||
    game?.period ||
    game?.clock ||
    game?.gameStatus ||
    'Scheduled'
  )
}

function normalizeGames(payload) {
  const source =
    payload?.games ||
    payload?.events ||
    payload?.data ||
    payload?.scoreboard ||
    payload?.items ||
    []

  return source.map((game, index) => ({
    id: game.id || game.gameId || game.uid || `${state.activeSport}-${index}`,
    home: getTeamName(game, 'home'),
    away: getTeamName(game, 'away'),
    homeScore: getScore(game, 'home'),
    awayScore: getScore(game, 'away'),
    status: getStatus(game),
    league: game.league || state.activeSport
  }))
}

function pickLeaders(games) {
  return games.slice(0, 6).map((game) => {
    const home = String(game.homeScore)
    const away = String(game.awayScore)
    const homeNum = Number(home)
    const awayNum = Number(away)
    let leader = 'Tied'
    if (!Number.isNaN(homeNum) && !Number.isNaN(awayNum)) {
      leader = homeNum > awayNum ? game.home : awayNum > homeNum ? game.away : 'Tied'
    }
    return { ...game, leader }
  })
}

async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`)
    if (!res.ok) throw new Error('health check failed')
    state.health = 'live'
  } catch {
    state.health = 'down'
  }
}

async function fetchScores() {
  state.loading = true
  state.error = ''
  render()
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/scores?sport=${encodeURIComponent(state.activeSport)}`)
    if (!res.ok) throw new Error(`scores failed: ${res.status}`)
    const data = await res.json()
    state.games = normalizeGames(data)
    state.tickerGames = pickLeaders(state.games)
    state.lastUpdated = new Date()
    if (!state.games.length) {
      state.error = 'No games returned for this sport yet.'
    }
  } catch (err) {
    state.games = []
    state.tickerGames = []
    state.error = 'Could not load scores from the live engine.'
  } finally {
    state.loading = false
    render()
  }
}

function toggleFavoriteTeam(team) {
  const list = state.profile.favoriteTeams
  const index = list.indexOf(team)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.unshift(team)
  }
  state.profile.favoriteTeams = [...list].slice(0, 6)
  state.profile.watchlistCount = state.profile.favoriteTeams.length
  saveProfile()
  render()
}

function renderTicker() {
  const items = state.tickerGames.length
    ? state.tickerGames.map((game) =>
        `<span class="ticker-item"><strong>${game.away}</strong> ${game.awayScore} @ <strong>${game.home}</strong> ${game.homeScore} · ${game.status}</span>`
      ).join('')
    : '<span class="ticker-item">Waiting for live game data…</span>'

  return `
    <section class="ticker-shell">
      <div class="ticker-label">COMMAND FEED</div>
      <div class="ticker-track">${items}${items}</div>
    </section>
  `
}

function renderGameCards() {
  if (state.loading) {
    return Array.from({ length: 4 }).map(() => `
      <article class="game-card skeleton-card">
        <div class="skeleton-line w-60"></div>
        <div class="skeleton-line w-35"></div>
        <div class="skeleton-score-row">
          <div class="skeleton-line w-50"></div>
          <div class="skeleton-line w-15"></div>
        </div>
        <div class="skeleton-score-row">
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-line w-15"></div>
        </div>
      </article>
    `).join('')
  }

  if (!state.games.length) {
    return `
      <article class="empty-card">
        <h3>No live cards yet</h3>
        <p>${state.error || 'As soon as games are available, they will appear here.'}</p>
      </article>
    `
  }

  return state.games.map((game) => {
    const homeFav = state.profile.favoriteTeams.includes(game.home)
    const awayFav = state.profile.favoriteTeams.includes(game.away)
    return `
      <article class="game-card">
        <div class="card-top">
          <span class="pill">${state.activeSport}</span>
          <span class="status-chip">${game.status}</span>
        </div>

        <div class="matchup">
          <div class="team-row">
            <button class="star-btn ${awayFav ? 'on' : ''}" data-favorite="${escapeHtml(game.away)}" title="Toggle favorite">★</button>
            <span class="team-name">${escapeHtml(game.away)}</span>
            <span class="team-score">${escapeHtml(String(game.awayScore))}</span>
          </div>
          <div class="team-row">
            <button class="star-btn ${homeFav ? 'on' : ''}" data-favorite="${escapeHtml(game.home)}" title="Toggle favorite">★</button>
            <span class="team-name">${escapeHtml(game.home)}</span>
            <span class="team-score">${escapeHtml(String(game.homeScore))}</span>
          </div>
        </div>

        <div class="card-bottom">
          <span>Command detail panel coming in Sprint 3</span>
          <button class="ghost-btn" data-alert="Tracked ${escapeHtml(game.away)} vs ${escapeHtml(game.home)}">Track game</button>
        </div>
      </article>
    `
  }).join('')
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function render() {
  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div>
          <div class="eyebrow">LOKI MAX</div>
          <h1>Live Sports Command Feed</h1>
          <p class="subtext">Sprint 2 replacement build with a premium dashboard foundation and live API mapping.</p>
        </div>
        <div class="hero-actions">
          <div class="health ${state.health}">
            <span class="dot"></span>
            ${state.health === 'live' ? 'API CONNECTED' : state.health === 'down' ? 'API OFFLINE' : 'CHECKING API'}
          </div>
          <button id="refreshBtn" class="primary-btn">Refresh feed</button>
        </div>
      </header>

      ${renderTicker()}

      <main class="dashboard">
        <section class="panel left-rail">
          <div class="panel-header">
            <h2>Operator</h2>
            <span>Local profile</span>
          </div>
          <div class="profile-card">
            <div class="profile-icon">L</div>
            <div>
              <div class="profile-name">${escapeHtml(state.profile.displayName)}</div>
              <div class="profile-sub">Sports OS preview account</div>
            </div>
          </div>

          <div class="stat-grid">
            <div class="mini-stat">
              <div class="mini-label">Favorite teams</div>
              <div class="mini-value">${state.profile.favoriteTeams.length}</div>
            </div>
            <div class="mini-stat">
              <div class="mini-label">Prediction streak</div>
              <div class="mini-value">${state.profile.predictionStreak}</div>
            </div>
            <div class="mini-stat">
              <div class="mini-label">Watchlist</div>
              <div class="mini-value">${state.profile.watchlistCount}</div>
            </div>
            <div class="mini-stat">
              <div class="mini-label">Last sync</div>
              <div class="mini-value small">${formatTime(state.lastUpdated)}</div>
            </div>
          </div>

          <div class="panel-block">
            <div class="block-title">Favorite teams</div>
            <div class="favorite-list">
              ${
                state.profile.favoriteTeams.length
                  ? state.profile.favoriteTeams.map((team) => `<span class="favorite-chip">${escapeHtml(team)}</span>`).join('')
                  : '<span class="muted">No teams pinned yet</span>'
              }
            </div>
          </div>

          <div class="panel-block">
            <div class="block-title">Build queue</div>
            <ul class="todo-list">
              <li>Account auth</li>
              <li>Prediction hub</li>
              <li>Game detail screen</li>
              <li>Smart alerts</li>
            </ul>
          </div>
        </section>

        <section class="panel center-feed">
          <div class="panel-header">
            <h2>Live scoreboard</h2>
            <span>${state.activeSport} feed</span>
          </div>

          <div class="sport-tabs">
            ${SPORTS.map((sport) => `
              <button class="tab-btn ${state.activeSport === sport ? 'active' : ''}" data-sport="${sport}">
                ${sport}
              </button>
            `).join('')}
          </div>

          ${state.error && !state.loading ? `<div class="inline-message">${escapeHtml(state.error)}</div>` : ''}

          <div class="cards-grid">
            ${renderGameCards()}
          </div>
        </section>

        <section class="panel right-rail">
          <div class="panel-header">
            <h2>Command modules</h2>
            <span>Feature sim</span>
          </div>

          <div class="module-card emphasis">
            <div class="module-title">Quick prediction</div>
            <p>Choose a winner, build streaks, and unlock a personal edge panel in Sprint 3.</p>
            <div class="module-actions">
              <button class="primary-btn small-btn" data-alert="Prediction mode preview saved">Preview</button>
              <button class="ghost-btn small-btn">Coming soon</button>
            </div>
          </div>

          <div class="module-card">
            <div class="module-title">Alert center</div>
            <ul class="alert-list">
              ${state.alerts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </div>

          <div class="module-card">
            <div class="module-title">Why this build is better</div>
            <ul class="alert-list">
              <li>Multi-panel app structure</li>
              <li>Favorites simulation now active</li>
              <li>Flexible score response mapping</li>
              <li>PWA-ready replacement package</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  `

  bindEvents()
}

function bindEvents() {
  document.querySelectorAll('[data-sport]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeSport = button.dataset.sport
      fetchScores()
    })
  })

  document.querySelector('#refreshBtn')?.addEventListener('click', fetchScores)

  document.querySelectorAll('[data-favorite]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleFavoriteTeam(button.dataset.favorite)
    })
  })

  document.querySelectorAll('[data-alert]').forEach((button) => {
    button.addEventListener('click', () => {
      const message = button.dataset.alert
      state.alerts = [message, ...state.alerts].slice(0, 5)
      render()
    })
  })
}

async function boot() {
  render()
  await fetchHealth()
  render()
  await fetchScores()
  setInterval(fetchHealth, 45000)
  setInterval(fetchScores, 60000)
}

boot()

:root{
  --bg:#06100c;
  --bg2:#0a1511;
  --panel:rgba(11,20,17,.9);
  --line:rgba(110,255,185,.16);
  --text:#ecfff5;
  --muted:#9ec4b1;
  --green:#7bff78;
  --mint:#43ffd1;
  --glow:0 0 0 1px rgba(123,255,120,.14), 0 16px 40px rgba(0,0,0,.45), 0 0 30px rgba(67,255,209,.08);
}

*{box-sizing:border-box}
html,body{margin:0;min-height:100%}
body{
  font-family: Inter, ui-sans-serif, system-ui, Arial, sans-serif;
  color:var(--text);
  background:
    radial-gradient(circle at top left, rgba(81,255,183,.12), transparent 24%),
    radial-gradient(circle at top right, rgba(123,255,120,.10), transparent 18%),
    radial-gradient(circle at bottom right, rgba(59,214,255,.08), transparent 20%),
    linear-gradient(180deg, #040806 0%, #07120e 40%, #040705 100%);
}

body::before{
  content:'';
  position:fixed; inset:0;
  pointer-events:none;
  background-image:
    linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,.7), transparent);
}

button{
  font:inherit;
  color:inherit;
}

.shell{
  width:min(1440px, calc(100% - 24px));
  margin:0 auto;
  padding:20px 0 28px;
}

.hero{
  display:flex;
  justify-content:space-between;
  gap:18px;
  align-items:flex-end;
  padding:20px;
  border:1px solid var(--line);
  border-radius:24px;
  background:linear-gradient(180deg, rgba(13,27,20,.92), rgba(8,15,12,.92));
  box-shadow:var(--glow);
}

.eyebrow{
  letter-spacing:.22em;
  color:var(--mint);
  font-size:.74rem;
  margin-bottom:6px;
}

h1{
  margin:0;
  font-size:clamp(1.9rem, 4vw, 3.2rem);
  line-height:1.02;
}

.subtext{
  margin:10px 0 0;
  color:var(--muted);
  max-width:760px;
}

.hero-actions{
  display:flex;
  flex-direction:column;
  align-items:flex-end;
  gap:10px;
}

.health{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:10px 14px;
  border-radius:999px;
  border:1px solid var(--line);
  color:var(--text);
  background:rgba(6,11,9,.7);
  font-size:.9rem;
  white-space:nowrap;
}

.dot{
  width:10px; height:10px; border-radius:999px; display:inline-block;
  background:#f7d56a;
  box-shadow:0 0 18px currentColor;
}
.health.live .dot{background:var(--green)}
.health.down .dot{background:#ff6d90}

.primary-btn, .ghost-btn, .tab-btn, .star-btn{
  border:none;
  cursor:pointer;
  transition:.18s ease;
}

.primary-btn{
  padding:12px 16px;
  border-radius:14px;
  background:linear-gradient(135deg, rgba(123,255,120,.95), rgba(67,255,209,.85));
  color:#08110d;
  font-weight:800;
  box-shadow:0 10px 24px rgba(67,255,209,.18);
}
.primary-btn:hover{transform:translateY(-1px)}

.ghost-btn{
  padding:10px 14px;
  border-radius:12px;
  background:rgba(255,255,255,.03);
  border:1px solid var(--line);
}
.ghost-btn:hover{background:rgba(255,255,255,.06)}

.small-btn{padding:10px 12px; font-size:.9rem}

.ticker-shell{
  display:flex;
  align-items:center;
  gap:16px;
  overflow:hidden;
  margin:16px 0;
  padding:14px 16px;
  border:1px solid var(--line);
  border-radius:18px;
  background:rgba(8,13,11,.86);
  box-shadow:var(--glow);
}

.ticker-label{
  flex:0 0 auto;
  color:var(--mint);
  font-size:.78rem;
  letter-spacing:.18em;
}

.ticker-track{
  display:flex;
  gap:32px;
  min-width:max-content;
  white-space:nowrap;
  animation:scrollTicker 40s linear infinite;
}

.ticker-item{
  color:var(--muted);
}
.ticker-item strong{color:var(--text)}

@keyframes scrollTicker{
  from{transform:translateX(0)}
  to{transform:translateX(-50%)}
}

.dashboard{
  display:grid;
  grid-template-columns: 300px minmax(0,1fr) 320px;
  gap:16px;
}

.panel{
  border:1px solid var(--line);
  border-radius:24px;
  background:linear-gradient(180deg, rgba(12,21,18,.88), rgba(7,12,10,.95));
  box-shadow:var(--glow);
  overflow:hidden;
}

.panel-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  padding:18px 18px 14px;
  border-bottom:1px solid rgba(255,255,255,.05);
}

.panel-header h2{
  margin:0;
  font-size:1.05rem;
}
.panel-header span{
  color:var(--muted);
  font-size:.85rem;
}

.left-rail, .right-rail{padding-bottom:18px}

.profile-card{
  display:flex;
  gap:14px;
  align-items:center;
  margin:18px;
  padding:14px;
  border:1px solid var(--line);
  border-radius:18px;
  background:rgba(255,255,255,.025);
}

.profile-icon{
  width:48px; height:48px;
  display:grid; place-items:center;
  border-radius:14px;
  background:linear-gradient(135deg, rgba(123,255,120,.22), rgba(67,255,209,.14));
  font-weight:900;
  color:var(--green);
}

.profile-name{font-weight:800}
.profile-sub{color:var(--muted); font-size:.88rem}

.stat-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0,1fr));
  gap:12px;
  padding:0 18px;
}

.mini-stat{
  padding:14px;
  border:1px solid var(--line);
  border-radius:18px;
  background:rgba(255,255,255,.025);
}
.mini-label{color:var(--muted); font-size:.82rem}
.mini-value{margin-top:8px; font-size:1.35rem; font-weight:800}
.mini-value.small{font-size:1rem}

.panel-block{
  margin:18px 18px 0;
  padding:16px;
  border:1px solid var(--line);
  border-radius:18px;
  background:rgba(255,255,255,.025);
}

.block-title{
  font-size:.82rem;
  text-transform:uppercase;
  letter-spacing:.12em;
  color:var(--mint);
  margin-bottom:12px;
}

.favorite-list{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.favorite-chip{
  padding:8px 10px;
  border-radius:999px;
  background:rgba(123,255,120,.10);
  border:1px solid rgba(123,255,120,.18);
  font-size:.86rem;
}

.todo-list, .alert-list{
  margin:0;
  padding-left:18px;
  color:var(--muted);
  display:grid;
  gap:10px;
}

.center-feed{
  padding-bottom:18px;
}

.sport-tabs{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  padding:16px 18px 0;
}

.tab-btn{
  padding:12px 16px;
  border-radius:14px;
  background:rgba(255,255,255,.03);
  border:1px solid var(--line);
  color:var(--text);
  font-weight:700;
}

.tab-btn.active{
  background:linear-gradient(135deg, rgba(123,255,120,.18), rgba(67,255,209,.12));
  color:var(--green);
  box-shadow:inset 0 0 0 1px rgba(123,255,120,.14);
}

.inline-message{
  margin:16px 18px 0;
  padding:12px 14px;
  border-radius:14px;
  border:1px solid rgba(255,109,144,.25);
  background:rgba(255,109,144,.08);
  color:#ffdce5;
}

.cards-grid{
  display:grid;
  grid-template-columns:repeat(2, minmax(0,1fr));
  gap:14px;
  padding:18px;
}

.game-card, .empty-card, .module-card{
  border:1px solid var(--line);
  border-radius:20px;
  background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
}

.game-card{
  padding:16px;
}

.card-top, .card-bottom, .team-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

.card-top{margin-bottom:14px}

.pill, .status-chip{
  display:inline-flex;
  align-items:center;
  border-radius:999px;
  padding:7px 10px;
  font-size:.75rem;
  border:1px solid var(--line);
}
.pill{color:var(--green); background:rgba(123,255,120,.07)}
.status-chip{color:var(--muted); background:rgba(255,255,255,.02)}

.matchup{
  display:grid;
  gap:12px;
}

.team-row{
  padding:12px 0;
  border-top:1px solid rgba(255,255,255,.04);
}
.team-row:first-child{border-top:none}

.team-name{
  flex:1;
  font-weight:700;
}

.team-score{
  font-size:2rem;
  line-height:1;
  font-weight:900;
}

.star-btn{
  width:30px;
  height:30px;
  border-radius:10px;
  background:rgba(255,255,255,.03);
  border:1px solid var(--line);
  color:#809f90;
}
.star-btn.on{
  color:#ffd86d;
  background:rgba(255,216,109,.12);
}

.card-bottom{
  margin-top:14px;
  padding-top:14px;
  border-top:1px solid rgba(255,255,255,.05);
  color:var(--muted);
  font-size:.86rem;
}

.empty-card{
  padding:28px;
  grid-column:1 / -1;
}
.empty-card h3{margin:0 0 8px}

.module-card{
  margin:18px;
  padding:16px;
}
.module-card.emphasis{
  background:
    radial-gradient(circle at top left, rgba(123,255,120,.08), transparent 42%),
    linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015));
}
.module-title{
  font-weight:800;
  margin-bottom:10px;
}
.module-card p{margin:0 0 14px; color:var(--muted)}
.module-actions{display:flex; gap:10px; flex-wrap:wrap}

.skeleton-card{padding:16px}
.skeleton-line{
  height:12px;
  border-radius:999px;
  background:linear-gradient(90deg, rgba(255,255,255,.05), rgba(255,255,255,.09), rgba(255,255,255,.05));
  background-size:200% 100%;
  animation:pulse 1.3s linear infinite;
}
.skeleton-score-row{
  display:flex;
  justify-content:space-between;
  gap:12px;
  margin-top:16px;
}
.w-60{width:60%}
.w-50{width:50%}
.w-40{width:40%}
.w-35{width:35%}
.w-15{width:15%}

@keyframes pulse{
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}

.muted{color:var(--muted)}

@media (max-width: 1180px){
  .dashboard{
    grid-template-columns:1fr;
  }
  .cards-grid{
    grid-template-columns:1fr 1fr;
  }
}

@media (max-width: 760px){
  .shell{
    width:min(100% - 16px, 100%);
    padding-top:12px;
  }
  .hero{
    flex-direction:column;
    align-items:flex-start;
  }
  .hero-actions{
    width:100%;
    align-items:stretch;
  }
  .cards-grid{
    grid-template-columns:1fr;
    padding:14px;
  }
  .panel-header{
    padding:16px 16px 12px;
  }
  .sport-tabs{padding:14px 14px 0}
  .module-card, .panel-block, .profile-card{margin:14px}
  .stat-grid{padding:0 14px}
  .ticker-shell{
    padding:12px 14px;
  }
}
