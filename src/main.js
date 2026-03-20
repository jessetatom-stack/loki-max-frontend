
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
