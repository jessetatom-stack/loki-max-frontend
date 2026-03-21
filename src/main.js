
import './styles.css'

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'https://loki-web-engine-v2.onrender.com'

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'WNBA', 'SOCCER', 'TENNIS', 'GOLF']

const state = {
  sport: 'NBA',
  games: [],
  loading: false,
  error: '',
  sheet: null,
  slip: load('loki_v14_real_slip', []),
  picks: load('loki_v14_real_picks', {}),
  toast: '',
  stats: {
    xp: 320,
    level: 3,
    rank: 2844,
    streak: 5,
    record: '14-5'
  }
}

const app = document.querySelector('#app')

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function showToast(msg) {
  state.toast = msg
  render()
  setTimeout(() => {
    if (state.toast === msg) {
      state.toast = ''
      render()
    }
  }, 1400)
}

async function fetchScores() {
  state.loading = true
  state.error = ''
  render()
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/scores?sport=${encodeURIComponent(state.sport)}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load games')
    state.games = Array.isArray(data.games) ? data.games : []
    if (!state.games.length) {
      state.error = 'No games returned right now. Try another sport.'
    }
  } catch (err) {
    state.games = []
    state.error = err.message
  } finally {
    state.loading = false
    render()
  }
}

function selected(key, value) {
  return state.picks[key] === value ? 'selected' : ''
}

function addToSlip(game, market, value) {
  const key = `${game.id}:${market}`
  state.picks[key] = value
  const entry = {
    key,
    matchup: `${game.away} vs ${game.home}`,
    market,
    value
  }
  const idx = state.slip.findIndex(s => s.key === key)
  if (idx >= 0) state.slip[idx] = entry
  else state.slip.unshift(entry)
  state.slip = state.slip.slice(0, 12)
  save('loki_v14_real_slip', state.slip)
  save('loki_v14_real_picks', state.picks)
  showToast('Added to slip')
}

function removeSlip(key) {
  state.slip = state.slip.filter(s => s.key !== key)
  delete state.picks[key]
  save('loki_v14_real_slip', state.slip)
  save('loki_v14_real_picks', state.picks)
  render()
}

function submitSlip() {
  if (!state.slip.length) {
    showToast('Slip is empty')
    return
  }
  const gain = state.slip.length * 16
  state.stats.xp += gain
  state.stats.level = Math.floor(state.stats.xp / 120) + 1
  state.stats.rank = Math.max(1, state.stats.rank - (state.slip.length * 13))
  state.sheet = null
  state.slip = []
  save('loki_v14_real_slip', state.slip)
  showToast(`Submitted +${gain} XP`)
  render()
}

function openSheet(kind, payload = {}) {
  state.sheet = { kind, payload }
  render()
}

function closeSheet() {
  state.sheet = null
  render()
}

function renderHeader() {
  return `
    <header class="header">
      <div>
        <div class="brand">LOKI MAX</div>
        <div class="sub">v1.4 real data sportsbook feel</div>
      </div>
      <div class="chip">${state.stats.xp} XP</div>
    </header>
  `
}

function renderStats() {
  return `
    <section class="stats-strip">
      <div class="stat-box"><span>Level</span><strong>${state.stats.level}</strong></div>
      <div class="stat-box"><span>Rank</span><strong>#${state.stats.rank}</strong></div>
      <div class="stat-box"><span>Streak</span><strong>${state.stats.streak}</strong></div>
      <div class="stat-box"><span>Record</span><strong>${state.stats.record}</strong></div>
    </section>
  `
}

function renderSportTabs() {
  return `
    <div class="sports">
      ${SPORTS.map(s => `<button class="sport-btn ${state.sport === s ? 'active' : ''}" data-sport="${s}">${s}</button>`).join('')}
    </div>
  `
}

function renderGameCard(game) {
  const winnerKey = `${game.id}:winner`
  const awayVal = game.away
  const homeVal = game.home
  return `
    <article class="game-card">
      <div class="game-top">
        <div>
          <div class="league">${game.league || state.sport}</div>
          <div class="start">${game.startTime || 'Upcoming'}</div>
        </div>
        <div class="status">${game.status || 'Scheduled'}</div>
      </div>
      <button class="title-row" data-details="${game.id}">
        <div>
          <div class="teams">${game.away} <span>vs</span> ${game.home}</div>
          <div class="records">${game.venue || 'Tap for more details'}</div>
        </div>
        <div class="chev">+</div>
      </button>
      <div class="market-label">Moneyline</div>
      <div class="tile-grid">
        <button class="tile ${selected(winnerKey, awayVal)}" data-add='${JSON.stringify([game.id, "winner", awayVal]).replace(/'/g, "&apos;")}'>
          <span>${game.away}</span>
          <strong>${game.awayScore !== '-' ? game.awayScore : 'Pick'}</strong>
        </button>
        <button class="tile alt ${selected(winnerKey, homeVal)}" data-add='${JSON.stringify([game.id, "winner", homeVal]).replace(/'/g, "&apos;")}'>
          <span>${game.home}</span>
          <strong>${game.homeScore !== '-' ? game.homeScore : 'Pick'}</strong>
        </button>
      </div>
    </article>
  `
}

function renderHome() {
  if (state.loading) return `<section class="panel"><div class="hint">Loading real games…</div></section>`
  if (state.error && !state.games.length) return `<section class="panel"><div class="hint">${state.error}</div></section>`
  return `
    <section class="stack">
      <section class="panel">
        <div class="panel-head">
          <h3>${state.sport} board</h3>
          <button class="ghost small" data-open="leaders">See all</button>
        </div>
        <div class="hint">Using real schedule and score data through your backend.</div>
      </section>
      ${state.games.map(renderGameCard).join('')}
    </section>
  `
}

function renderPicks() {
  return `
    <section class="panel">
      <div class="panel-head">
        <h3>Your picks</h3>
        <button class="ghost small" data-slip="open">Open slip</button>
      </div>
      ${
        state.slip.length
          ? state.slip.map(s => `
              <div class="pick-row">
                <div>
                  <div class="pick-title">${s.value}</div>
                  <div class="pick-sub">${s.matchup} · ${s.market}</div>
                </div>
                <button class="icon-btn" data-remove="${s.key}">×</button>
              </div>
            `).join('')
          : '<div class="hint">No picks yet. Add a side from the live board.</div>'
      }
    </section>
  `
}

function renderLeaders() {
  return `
    <section class="panel">
      <div class="panel-head"><h3>Leaderboard</h3></div>
      ${[
        ['SportsFan1', 1080, '62-33'],
        ['HoopsMaster', 942, '53-28'],
        ['KingKobe', 830, '47-24'],
        ['Loki Operator', state.stats.xp, state.stats.record]
      ].map((row, i) => `
        <div class="leader-row">
          <div>
            <div class="pick-title">#${i + 1} ${row[0]}</div>
            <div class="pick-sub">${row[2]}</div>
          </div>
          <div class="leader-score">${row[1]} XP</div>
        </div>
      `).join('')}
    </section>
  `
}

function renderProfile() {
  return `
    <section class="panel">
      <div class="panel-head"><h3>Profile</h3></div>
      <div class="profile-card">
        <div class="profile-avatar">L</div>
        <div>
          <div class="pick-title">Loki Operator</div>
          <div class="pick-sub">Level ${state.stats.level} · Rank #${state.stats.rank}</div>
        </div>
      </div>
    </section>
  `
}

function renderMain() {
  return renderHome()
}

function renderSheet() {
  if (!state.sheet) return ''
  if (state.sheet.kind === 'details') {
    const game = state.games.find(g => String(g.id) === String(state.sheet.payload.id))
    if (!game) return ''
    return `
      <div class="sheet-backdrop" data-close="sheet"></div>
      <section class="sheet">
        <div class="grab"></div>
        <div class="sheet-head">
          <div>
            <div class="sheet-title">${game.away} vs ${game.home}</div>
            <div class="pick-sub">${game.startTime || ''}</div>
          </div>
          <button class="icon-btn" data-close="sheet">×</button>
        </div>
        <div class="sheet-block">
          <div class="market-label">Status</div>
          <div class="sheet-copy">${game.status || 'Scheduled'}</div>
        </div>
        <div class="sheet-block">
          <div class="market-label">Venue</div>
          <div class="sheet-copy">${game.venue || 'No venue returned for this game.'}</div>
        </div>
        <div class="sheet-block">
          <div class="market-label">League</div>
          <div class="sheet-copy">${game.league || state.sport}</div>
        </div>
        <button class="submit" data-close="sheet">Done</button>
      </section>
    `
  }

  return `
    <div class="sheet-backdrop" data-close="sheet"></div>
    <section class="sheet">
      <div class="grab"></div>
      <div class="sheet-head">
        <div>
          <div class="sheet-title">Bet slip</div>
          <div class="pick-sub">${state.slip.length} picks ready</div>
        </div>
        <button class="icon-btn" data-close="sheet">×</button>
      </div>
      <div class="sheet-list">
        ${
          state.slip.length
            ? state.slip.map(s => `
                <div class="sheet-pick">
                  <div>
                    <div class="pick-title">${s.value}</div>
                    <div class="pick-sub">${s.matchup} · ${s.market}</div>
                  </div>
                  <button class="icon-btn" data-remove="${s.key}">×</button>
                </div>
              `).join('')
            : '<div class="hint">Build a slip by tapping sides on the board.</div>'
        }
      </div>
      <button class="submit" data-submit="slip">Submit picks</button>
    </section>
  `
}

function renderNav() {
  return `
    <nav class="nav">
      <button class="nav-btn active">Home</button>
      <button class="nav-btn" data-open="picks">Picks</button>
      <button class="nav-btn" data-open="leaders">Leaders</button>
      <button class="nav-btn" data-open="profile">Profile</button>
      <button class="nav-btn" data-slip="open">Slip ${state.slip.length ? state.slip.length : ''}</button>
    </nav>
  `
}

function render() {
  app.innerHTML = `
    <div class="shell">
      ${renderHeader()}
      ${renderStats()}
      ${renderSportTabs()}
      <main class="main">${renderMain()}</main>
      <button class="fab" data-slip="open">Slip ${state.slip.length ? state.slip.length : ''}</button>
      ${renderNav()}
      ${renderSheet()}
      ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
    </div>
  `
  bind()
}

function bind() {
  document.querySelectorAll('[data-sport]').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.sport = btn.dataset.sport
      await fetchScores()
    })
  })
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [id, market, value] = JSON.parse(btn.dataset.add)
      const game = state.games.find(g => String(g.id) === String(id))
      if (!game) return
      addToSlip(game, market, value)
    })
  })
  document.querySelectorAll('[data-details]').forEach(btn => {
    btn.addEventListener('click', () => openSheet('details', { id: btn.dataset.details }))
  })
  document.querySelectorAll('[data-slip]').forEach(btn => {
    btn.addEventListener('click', () => openSheet('slip'))
  })
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.open
      if (target === 'picks') {
        app.innerHTML = `<div class="shell">${renderHeader()}${renderStats()}${renderSportTabs()}<main class="main">${renderPicks()}</main>${renderNav()}</div>`
        bind()
      } else if (target === 'leaders') {
        app.innerHTML = `<div class="shell">${renderHeader()}${renderStats()}${renderSportTabs()}<main class="main">${renderLeaders()}</main>${renderNav()}</div>`
        bind()
      } else {
        app.innerHTML = `<div class="shell">${renderHeader()}${renderStats()}${renderSportTabs()}<main class="main">${renderProfile()}</main>${renderNav()}</div>`
        bind()
      }
    })
  })
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeSlip(btn.dataset.remove))
  })
  document.querySelectorAll('[data-submit]').forEach(btn => {
    btn.addEventListener('click', submitSlip)
  })
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', closeSheet)
  })
}

fetchScores()
render()
