
import './styles.css'

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'https://loki-web-engine-v2.onrender.com'

const SPORTS = [
  { key: 'NBA', label: 'NBA' },
  { key: 'NFL', label: 'NFL' },
  { key: 'MLB', label: 'MLB' },
  { key: 'NHL', label: 'NHL' },
  { key: 'WNBA', label: 'WNBA' },
  { key: 'NCAAM', label: 'NCAA M' },
  { key: 'NCAAW', label: 'NCAA W' },
  { key: 'SOCCER', label: 'Soccer' },
  { key: 'TENNIS', label: 'Tennis' },
  { key: 'GOLF', label: 'Golf' }
]

const FALLBACK = {
  NBA: [
    { id:'nba-1', away:'Warriors', home:'Lakers', awayScore:'108', homeScore:'112', status:'Final', startTime:'Today · 7:30 PM', records:'15-15 · 16-12', total:'219.5', spreadAway:'+1.5', spreadHome:'-1.5', moneyAway:'+108', moneyHome:'-150', lock:'Locked' },
    { id:'nba-2', away:'Celtics', home:'Bucks', awayScore:'97', homeScore:'101', status:'Q4 · 2:14', startTime:'Today · Live', records:'18-9 · 17-11', total:'226.5', spreadAway:'-2.5', spreadHome:'+2.5', moneyAway:'-118', moneyHome:'+100', lock:'Closes in 2m' }
  ],
  NFL: [
    { id:'nfl-1', away:'Chiefs', home:'Bills', awayScore:'24', homeScore:'27', status:'Final', startTime:'Sun · 4:25 PM', records:'12-4 · 13-3', total:'49.5', spreadAway:'+2.5', spreadHome:'-2.5', moneyAway:'+120', moneyHome:'-140', lock:'Locked' },
    { id:'nfl-2', away:'Ravens', home:'Bengals', awayScore:'17', homeScore:'14', status:'Q4 · 9:11', startTime:'Sun · Live', records:'11-5 · 10-6', total:'46.5', spreadAway:'-1.5', spreadHome:'+1.5', moneyAway:'-115', moneyHome:'-105', lock:'Closes in 9m' }
  ],
  MLB: [
    { id:'mlb-1', away:'Dodgers', home:'Padres', awayScore:'6', homeScore:'4', status:'Final', startTime:'Today · 9:10 PM', records:'18-7 · 14-11', total:'8.5', spreadAway:'-1.5', spreadHome:'+1.5', moneyAway:'-145', moneyHome:'+125', lock:'Locked' },
    { id:'mlb-2', away:'Yankees', home:'Red Sox', awayScore:'3', homeScore:'2', status:'Top 8', startTime:'Today · Live', records:'16-8 · 12-13', total:'9.0', spreadAway:'-1.5', spreadHome:'+1.5', moneyAway:'-120', moneyHome:'+102', lock:'Closes in 5m' }
  ],
  NHL: [
    { id:'nhl-1', away:'Rangers', home:'Bruins', awayScore:'4', homeScore:'3', status:'Final', startTime:'Tonight · 7:00 PM', records:'20-8 · 19-9', total:'5.5', spreadAway:'-1.5', spreadHome:'+1.5', moneyAway:'+115', moneyHome:'-135', lock:'Locked' }
  ],
  WNBA: [
    { id:'wnba-1', away:'Aces', home:'Liberty', awayScore:'81', homeScore:'77', status:'Final', startTime:'Tonight · 8:00 PM', records:'9-2 · 8-3', total:'168.5', spreadAway:'-3.5', spreadHome:'+3.5', moneyAway:'-150', moneyHome:'+130', lock:'Locked' }
  ],
  NCAAM: [
    { id:'ncaam-1', away:'Duke', home:'UNC', awayScore:'72', homeScore:'70', status:'Final', startTime:'Sat · 6:00 PM', records:'22-7 · 21-8', total:'151.5', spreadAway:'-2.5', spreadHome:'+2.5', moneyAway:'-125', moneyHome:'+108', lock:'Locked' }
  ],
  NCAAW: [
    { id:'ncaaw-1', away:'Iowa', home:'UConn', awayScore:'68', homeScore:'74', status:'Final', startTime:'Fri · 7:00 PM', records:'24-5 · 23-6', total:'146.5', spreadAway:'+3.5', spreadHome:'-3.5', moneyAway:'+135', moneyHome:'-155', lock:'Locked' }
  ],
  SOCCER: [
    { id:'soccer-1', away:'Arsenal', home:'Chelsea', awayScore:'2', homeScore:'1', status:'FT', startTime:'Today · 3:00 PM', records:'W4 · W2', total:'2.5', spreadAway:'PK', spreadHome:'PK', moneyAway:'+145', moneyHome:'+170', lock:'Locked' }
  ],
  TENNIS: [
    { id:'tennis-1', away:'Alcaraz', home:'Sinner', awayScore:'2', homeScore:'1', status:'Set 4', startTime:'Today · Live', records:'8-2 · 9-1', total:'39.5', spreadAway:'-2.5', spreadHome:'+2.5', moneyAway:'-110', moneyHome:'-110', lock:'Closes in 1m' }
  ],
  GOLF: [
    { id:'golf-1', away:'Scheffler', home:'McIlroy', awayScore:'-11', homeScore:'-9', status:'Round 4', startTime:'Today · Live', records:'1st · 3rd', total:'268.5', spreadAway:'-1.5', spreadHome:'+1.5', moneyAway:'-135', moneyHome:'+115', lock:'Closes in 11m' }
  ]
}

const state = {
  activeSport: 'NBA',
  activeNav: 'home',
  health: 'checking',
  games: [],
  loading: false,
  error: '',
  token: localStorage.getItem('loki_token') || '',
  user: loadJson('loki_user', { username: 'Guest123', xp: 120, level: 2 }),
  stats: loadJson('loki_stats_preview', { xp: 120, level: 2, accuracy: 80, winStreak: 6, rank: 4743, record: '8-2' }),
  picks: loadJson('loki_sprint7_picks', {}),
  leaderboard: [
    { username: 'SportsFan1', xp: 1040, level: 12, accuracy: 66, record:'60-32' },
    { username: 'HoopsMaster', xp: 920, level: 10, accuracy: 65, record:'51-28' },
    { username: 'KingKobe', xp: 805, level: 9, accuracy: 65, record:'45-24' },
    { username: 'MaverickMike', xp: 710, level: 8, accuracy: 64, record:'38-21' },
    { username: 'BetManal3', xp: 690, level: 8, accuracy: 62, record:'32-20' }
  ],
  betSlip: [],
  message: ''
}

const app = document.querySelector('#app')

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
async function api(path) {
  const headers = { 'Content-Type': 'application/json' }
  if (state.token) headers.Authorization = `Bearer ${state.token}`
  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
async function fetchHealth() {
  try {
    await api('/api/v1/health')
    state.health = 'live'
  } catch {
    state.health = 'down'
  }
}
function enrichGames(games, sport) {
  return games.map((g, i) => ({
    id: g.id || `${sport}-${i}`,
    away: g.away || 'Away',
    home: g.home || 'Home',
    awayScore: g.awayScore ?? '-',
    homeScore: g.homeScore ?? '-',
    status: g.status || 'Scheduled',
    startTime: g.startTime || (String(g.status || '').toLowerCase().includes('final') ? 'Today · Completed' : 'Today · 7:00 PM'),
    records: g.records || '0-0 · 0-0',
    total: g.total || (sport === 'MLB' ? '8.5' : sport === 'NFL' ? '47.5' : '219.5'),
    spreadAway: g.spreadAway || '+1.5',
    spreadHome: g.spreadHome || '-1.5',
    moneyAway: g.moneyAway || '+108',
    moneyHome: g.moneyHome || '-120',
    lock: g.lock || 'Closes in 58m'
  }))
}
async function fetchScores() {
  state.loading = true
  state.error = ''
  render()
  try {
    const data = await api(`/api/v1/scores?sport=${encodeURIComponent(state.activeSport)}`)
    const liveGames = Array.isArray(data.games) && data.games.length ? data.games : FALLBACK[state.activeSport] || []
    state.games = enrichGames(liveGames, state.activeSport)
  } catch {
    state.games = enrichGames(FALLBACK[state.activeSport] || [], state.activeSport)
    state.error = ''
  } finally {
    state.loading = false
    render()
  }
}
function getPick(gameId, market) {
  return state.picks[`${gameId}:${market}`] || ''
}
function setPick(game, market, value) {
  state.picks[`${game.id}:${market}`] = value
  const existing = state.betSlip.find(item => item.key === `${game.id}:${market}`)
  const payload = {
    key: `${game.id}:${market}`,
    gameId: game.id,
    matchup: `${game.away} vs ${game.home}`,
    market,
    value
  }
  if (existing) Object.assign(existing, payload)
  else state.betSlip.unshift(payload)
  state.betSlip = state.betSlip.slice(0, 12)
  saveJson('loki_sprint7_picks', state.picks)
  saveJson('loki_sprint7_betslip', state.betSlip)
  state.message = `${value} added to slip`
  render()
}
function submitSlip() {
  if (!state.betSlip.length) {
    state.message = 'No picks in slip yet'
    render()
    return
  }
  const wins = Math.min(state.betSlip.length, 4)
  state.stats.xp += state.betSlip.length * 15
  state.stats.level = Math.max(1, Math.floor(state.stats.xp / 100) + 1)
  state.stats.record = `${8 + wins}-${2 + Math.max(0, state.betSlip.length - wins)}`
  state.stats.rank = Math.max(1, state.stats.rank - state.betSlip.length * 17)
  state.message = `${state.betSlip.length} picks submitted`
  saveJson('loki_stats_preview', state.stats)
  state.betSlip = []
  saveJson('loki_sprint7_betslip', state.betSlip)
  render()
}
function lockBadge(game) {
  return `<span class="lock-chip">${escapeHtml(game.lock)}</span>`
}
function renderTopBar() {
  return `
    <header class="topbar">
      <div class="brand-block">
        <div class="brand">LOKI MAX</div>
        <div class="brand-sub">Premium sports command feed</div>
      </div>
      <div class="top-actions">
        <div class="xp-pill">${state.stats.xp} XP</div>
        <div class="xp-pill muted-pill">Lv ${state.stats.level}</div>
        <div class="avatar-pill">${escapeHtml(state.user.username?.[0] || 'G')}</div>
      </div>
    </header>
  `
}
function renderSportsTabs() {
  return `
    <div class="sports-strip">
      ${SPORTS.map(s => `
        <button class="sport-tab ${state.activeSport === s.key ? 'active' : ''}" data-sport="${s.key}">
          ${s.label}
        </button>
      `).join('')}
    </div>
  `
}
function renderGameCard(game) {
  const winnerPick = getPick(game.id, 'winner')
  const totalPick = getPick(game.id, 'total')
  const spreadPick = getPick(game.id, 'spread')
  return `
    <article class="match-card">
      <div class="match-meta">
        <span>${escapeHtml(game.startTime)}</span>
        <span>${escapeHtml(game.status)}</span>
      </div>

      <div class="matchup-line">
        <div class="team-cluster">
          <div class="team-dot"></div>
          <div>
            <div class="matchup-title">${escapeHtml(game.away)} <span class="vs">vs</span> ${escapeHtml(game.home)}</div>
            <div class="matchup-sub">${escapeHtml(game.records)}</div>
          </div>
        </div>
        ${lockBadge(game)}
      </div>

      <div class="market-title">Pick a winner</div>
      <div class="odds-grid two">
        <button class="odds-tile ${winnerPick === game.away ? 'selected green' : ''}" data-pick='${JSON.stringify({id: game.id, market: "winner", value: game.away}).replace(/'/g, "&apos;")}'>
          <span class="tile-main">${escapeHtml(game.away)}</span>
          <span class="tile-odd">${escapeHtml(game.moneyAway)}</span>
        </button>
        <button class="odds-tile ${winnerPick === game.home ? 'selected gold' : ''}" data-pick='${JSON.stringify({id: game.id, market: "winner", value: game.home}).replace(/'/g, "&apos;")}'>
          <span class="tile-main">${escapeHtml(game.home)}</span>
          <span class="tile-odd">${escapeHtml(game.moneyHome)}</span>
        </button>
      </div>

      <div class="market-title">Total</div>
      <div class="odds-grid two">
        <button class="odds-tile ${totalPick === `Over ${game.total}` ? 'selected' : ''}" data-pick='${JSON.stringify({id: game.id, market: "total", value: `Over ${game.total}`}).replace(/'/g, "&apos;")}'>
          <span class="tile-main">Over ${escapeHtml(game.total)}</span>
          <span class="tile-odd">-110</span>
        </button>
        <button class="odds-tile ${totalPick === `Under ${game.total}` ? 'selected' : ''}" data-pick='${JSON.stringify({id: game.id, market: "total", value: `Under ${game.total}`}).replace(/'/g, "&apos;")}'>
          <span class="tile-main">Under ${escapeHtml(game.total)}</span>
          <span class="tile-odd">-110</span>
        </button>
      </div>

      <div class="market-title">Spread</div>
      <div class="odds-grid two">
        <button class="odds-tile ${spreadPick === `${game.away} ${game.spreadAway}` ? 'selected' : ''}" data-pick='${JSON.stringify({id: game.id, market: "spread", value: `${game.away} ${game.spreadAway}`}).replace(/'/g, "&apos;")}'>
          <span class="tile-main">${escapeHtml(game.away)} ${escapeHtml(game.spreadAway)}</span>
          <span class="tile-odd">${escapeHtml(game.moneyAway)}</span>
        </button>
        <button class="odds-tile ${spreadPick === `${game.home} ${game.spreadHome}` ? 'selected' : ''}" data-pick='${JSON.stringify({id: game.id, market: "spread", value: `${game.home} ${game.spreadHome}`}).replace(/'/g, "&apos;")}'>
          <span class="tile-main">${escapeHtml(game.home)} ${escapeHtml(game.spreadHome)}</span>
          <span class="tile-odd">${escapeHtml(game.moneyHome)}</span>
        </button>
      </div>
    </article>
  `
}
function renderLeaderboard() {
  return `
    <section class="stack-card">
      <div class="section-head">
        <h3>Leaderboard</h3>
        <button class="mini-link">See all</button>
      </div>
      <div class="leader-list">
        ${state.leaderboard.map((row, idx) => `
          <div class="leader-row">
            <div>
              <div class="leader-name">#${idx + 1} ${escapeHtml(row.username)}</div>
              <div class="leader-sub">${escapeHtml(row.record)} · ${row.accuracy}%</div>
            </div>
            <div class="leader-points">${row.xp} pts</div>
          </div>
        `).join('')}
      </div>
    </section>
  `
}
function renderProfileStrip() {
  return `
    <section class="stack-card profile-strip">
      <div class="profile-metric"><span class="metric-label">Rank</span><span class="metric-value">#${state.stats.rank}</span></div>
      <div class="profile-metric"><span class="metric-label">Record</span><span class="metric-value">${escapeHtml(state.stats.record)}</span></div>
      <div class="profile-metric"><span class="metric-label">Accuracy</span><span class="metric-value">${state.stats.accuracy}%</span></div>
      <div class="profile-metric"><span class="metric-label">XP</span><span class="metric-value">${state.stats.xp}</span></div>
    </section>
  `
}
function renderBottomNav() {
  const items = [
    ['home', 'Home'],
    ['live', 'Live'],
    ['slip', `Picks ${state.betSlip.length ? `(${state.betSlip.length})` : ''}`],
    ['leaders', 'Leaderboard'],
    ['profile', 'Profile']
  ]
  return `
    <nav class="bottom-nav">
      ${items.map(([key, label]) => `
        <button class="nav-btn ${state.activeNav === key ? 'active' : ''}" data-nav="${key}">${label}</button>
      `).join('')}
    </nav>
  `
}
function renderBetSlip() {
  return `
    <section class="stack-card slip-card">
      <div class="section-head">
        <h3>Bet slip</h3>
        <span class="muted-text">${state.betSlip.length} picks</span>
      </div>
      <div class="slip-list">
        ${state.betSlip.length ? state.betSlip.map(item => `
          <div class="slip-row">
            <div>
              <div class="slip-title">${escapeHtml(item.value)}</div>
              <div class="slip-sub">${escapeHtml(item.matchup)} · ${escapeHtml(item.market)}</div>
            </div>
          </div>
        `).join('') : '<div class="empty-note">Build a slip by tapping odds tiles.</div>'}
      </div>
      <button class="submit-btn" id="submitSlipBtn">Submit picks</button>
    </section>
  `
}
function renderHome() {
  return `
    ${renderProfileStrip()}
    <section class="matches-stack">
      ${state.loading
        ? '<section class="stack-card"><div class="empty-note">Loading live board…</div></section>'
        : state.games.map(renderGameCard).join('')}
    </section>
    ${renderLeaderboard()}
    ${renderBetSlip()}
  `
}
function renderSimplePanel(title, text) {
  return `<section class="stack-card"><div class="section-head"><h3>${title}</h3></div><div class="empty-note">${text}</div></section>`
}
function renderMain() {
  if (state.activeNav === 'home') return renderHome()
  if (state.activeNav === 'live') return renderSimplePanel('Live board', 'Live-only filtered mode comes next. For now, use the top sport tabs and current live cards.')
  if (state.activeNav === 'slip') return renderBetSlip()
  if (state.activeNav === 'leaders') return renderLeaderboard()
  return renderSimplePanel('Profile', `Operator ${escapeHtml(state.user.username)} · Level ${state.stats.level} · ${state.stats.xp} XP`)
}
function render() {
  app.innerHTML = `
    <div class="phone-shell">
      ${renderTopBar()}
      <div class="status-row">
        <span class="status-dot ${state.health}"></span>
        <span>${state.health === 'live' ? 'API connected' : 'Offline preview mode'}</span>
        <button class="refresh-btn" id="refreshBtn">Refresh</button>
      </div>
      ${renderSportsTabs()}
      ${state.message ? `<div class="toast">${escapeHtml(state.message)}</div>` : ''}
      ${state.error ? `<div class="toast warn">${escapeHtml(state.error)}</div>` : ''}
      <main class="main-feed">
        ${renderMain()}
      </main>
      ${renderBottomNav()}
    </div>
  `
  bindEvents()
}
function bindEvents() {
  document.querySelector('#refreshBtn')?.addEventListener('click', async () => {
    state.message = 'Feed refreshed'
    await fetchHealth()
    await fetchScores()
  })
  document.querySelector('#submitSlipBtn')?.addEventListener('click', submitSlip)
  document.querySelectorAll('[data-sport]').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.activeSport = btn.dataset.sport
      state.message = ''
      await fetchScores()
    })
  })
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeNav = btn.dataset.nav
      render()
    })
  })
  document.querySelectorAll('[data-pick]').forEach(btn => {
    btn.addEventListener('click', () => {
      const payload = JSON.parse(btn.dataset.pick)
      const game = state.games.find(g => String(g.id) === String(payload.id))
      if (!game) return
      setPick(game, payload.market, payload.value)
    })
  })
}
async function boot() {
  state.betSlip = loadJson('loki_sprint7_betslip', [])
  render()
  await fetchHealth()
  await fetchScores()
}
boot()
