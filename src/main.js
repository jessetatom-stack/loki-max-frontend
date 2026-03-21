
import './styles.css'

const app = document.querySelector('#app')

const state = {
  activeTab: 'home',
  sheet: null,
  toast: '',
  xp: 285,
  level: 3,
  rank: 3281,
  streak: 4,
  record: '12-4',
  slip: load('loki_v13_slip', []),
  picks: load('loki_v13_picks', {}),
  expanded: null
}

const games = [
  {
    id: 'g1',
    league: 'NBA',
    start: 'Tonight · 7:30 PM',
    lock: 'Lock in 46m',
    away: 'Warriors',
    home: 'Lakers',
    awayRec: '19-14',
    homeRec: '20-13',
    moneyAway: '+118',
    moneyHome: '-142',
    spreadAway: '+2.5',
    spreadHome: '-2.5',
    total: '229.5',
    trend: '72% on Lakers ML',
    note: 'Prime-time matchup. Public leaning home.'
  },
  {
    id: 'g2',
    league: 'NFL',
    start: 'Sunday · 4:25 PM',
    lock: 'Lock in 2d',
    away: 'Chiefs',
    home: 'Bills',
    awayRec: '12-4',
    homeRec: '13-3',
    moneyAway: '+124',
    moneyHome: '-148',
    spreadAway: '+3.0',
    spreadHome: '-3.0',
    total: '47.5',
    trend: 'Sharp money on Over',
    note: 'Weather mild. Good QB spot.'
  },
  {
    id: 'g3',
    league: 'MLB',
    start: 'Tomorrow · 9:10 PM',
    lock: 'Lock in 18h',
    away: 'Dodgers',
    home: 'Padres',
    awayRec: '18-7',
    homeRec: '14-11',
    moneyAway: '-132',
    moneyHome: '+112',
    spreadAway: '-1.5',
    spreadHome: '+1.5',
    total: '8.5',
    trend: '63% on Dodgers RL',
    note: 'Projected pitcher edge for away side.'
  }
]

const leaderboard = [
  ['SportsFan1', 1040, '60-32'],
  ['HoopsMaster', 920, '51-28'],
  ['KingKobe', 805, '45-24'],
  ['MaverickMike', 710, '38-21'],
  ['BetManal3', 690, '32-20'],
  ['ClutchWatch', 650, '34-21'],
  ['SharpTakes', 625, '29-18']
]

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

function toast(message) {
  state.toast = message
  render()
  setTimeout(() => {
    if (state.toast === message) {
      state.toast = ''
      render()
    }
  }, 1400)
}

function openSheet(kind, payload = {}) {
  state.sheet = { kind, payload }
  render()
}

function closeSheet() {
  state.sheet = null
  render()
}

function addToSlip(gameId, market, value) {
  const key = `${gameId}:${market}`
  state.picks[key] = value
  const game = games.find(g => g.id === gameId)
  const entry = {
    key,
    gameId,
    market,
    value,
    matchup: `${game.away} vs ${game.home}`
  }
  const idx = state.slip.findIndex(s => s.key === key)
  if (idx >= 0) state.slip[idx] = entry
  else state.slip.unshift(entry)
  state.slip = state.slip.slice(0, 12)
  save('loki_v13_picks', state.picks)
  save('loki_v13_slip', state.slip)
  toast('Added to slip')
}

function removeSlip(key) {
  state.slip = state.slip.filter(s => s.key !== key)
  delete state.picks[key]
  save('loki_v13_picks', state.picks)
  save('loki_v13_slip', state.slip)
  render()
}

function submitSlip() {
  if (!state.slip.length) {
    toast('Slip is empty')
    return
  }
  const gain = state.slip.length * 18
  state.xp += gain
  state.level = Math.floor(state.xp / 120) + 1
  state.rank = Math.max(1, state.rank - (state.slip.length * 19))
  state.record = `${12 + state.slip.length}-${4}`
  state.sheet = null
  state.slip = []
  save('loki_v13_slip', state.slip)
  toast(`Submitted +${gain} XP`)
  render()
}

function toggleExpand(id) {
  state.expanded = state.expanded === id ? null : id
  render()
}

function selected(gameId, market, value) {
  return state.picks[`${gameId}:${market}`] === value ? 'selected' : ''
}

function renderHeader() {
  return `
    <header class="header">
      <div>
        <div class="brand">LOKI MAX</div>
        <div class="sub">v1.3 · polished layered build</div>
      </div>
      <div class="header-right">
        <div class="chip xp">${state.xp} XP</div>
        <div class="avatar">L</div>
      </div>
    </header>
  `
}

function renderStatsStrip() {
  return `
    <section class="stats-strip">
      <div class="stat-box"><span>Level</span><strong>${state.level}</strong></div>
      <div class="stat-box"><span>Rank</span><strong>#${state.rank}</strong></div>
      <div class="stat-box"><span>Streak</span><strong>${state.streak}</strong></div>
      <div class="stat-box"><span>Record</span><strong>${state.record}</strong></div>
    </section>
  `
}

function renderCard(game) {
  const expanded = state.expanded === game.id
  return `
    <article class="game-card ${expanded ? 'open' : ''}">
      <div class="game-top">
        <div>
          <div class="league">${game.league}</div>
          <div class="start">${game.start}</div>
        </div>
        <div class="lock">${game.lock}</div>
      </div>

      <button class="title-row" data-expand="${game.id}">
        <div>
          <div class="teams">${game.away} <span>vs</span> ${game.home}</div>
          <div class="records">${game.awayRec} · ${game.homeRec}</div>
        </div>
        <div class="chev">${expanded ? '−' : '+'}</div>
      </button>

      <div class="market-label">Winner</div>
      <div class="tile-grid">
        <button class="tile ${selected(game.id, 'winner', game.away)}" data-add='${JSON.stringify([game.id,"winner",game.away]).replace(/'/g,"&apos;")}'>
          <span>${game.away}</span><strong>${game.moneyAway}</strong>
        </button>
        <button class="tile ${selected(game.id, 'winner', game.home)} alt" data-add='${JSON.stringify([game.id,"winner",game.home]).replace(/'/g,"&apos;")}'>
          <span>${game.home}</span><strong>${game.moneyHome}</strong>
        </button>
      </div>

      ${expanded ? `
        <div class="expand-wrap">
          <div class="market-label">Spread</div>
          <div class="tile-grid">
            <button class="tile ${selected(game.id, 'spread', `${game.away} ${game.spreadAway}`)}" data-add='${JSON.stringify([game.id,"spread",`${game.away} ${game.spreadAway}`]).replace(/'/g,"&apos;")}'>
              <span>${game.away} ${game.spreadAway}</span><strong>${game.moneyAway}</strong>
            </button>
            <button class="tile ${selected(game.id, 'spread', `${game.home} ${game.spreadHome}`)} alt" data-add='${JSON.stringify([game.id,"spread",`${game.home} ${game.spreadHome}`]).replace(/'/g,"&apos;")}'>
              <span>${game.home} ${game.spreadHome}</span><strong>${game.moneyHome}</strong>
            </button>
          </div>

          <div class="market-label">Total</div>
          <div class="tile-grid">
            <button class="tile ${selected(game.id, 'total', `Over ${game.total}`)}" data-add='${JSON.stringify([game.id,"total",`Over ${game.total}`]).replace(/'/g,"&apos;")}'>
              <span>Over ${game.total}</span><strong>-110</strong>
            </button>
            <button class="tile ${selected(game.id, 'total', `Under ${game.total}`)}" data-add='${JSON.stringify([game.id,"total",`Under ${game.total}`]).replace(/'/g,"&apos;")}'>
              <span>Under ${game.total}</span><strong>-110</strong>
            </button>
          </div>

          <div class="mini-note">
            <div>${game.trend}</div>
            <button class="ghost" data-details="${game.id}">Insights</button>
          </div>
        </div>
      ` : ''}
    </article>
  `
}

function renderHome() {
  return `
    <section class="stack">
      <section class="panel">
        <div class="panel-head">
          <h3>Up next</h3>
          <button class="ghost small" data-open="leaders">See all</button>
        </div>
        <div class="hint">Tighter layout. Expand any card for deeper markets.</div>
      </section>
      ${games.map(renderCard).join('')}
    </section>
  `
}

function renderLive() {
  return `
    <section class="panel">
      <div class="panel-head"><h3>Live activity</h3></div>
      <div class="live-row"><strong>Celtics vs Bucks</strong><span>Q4 · 2:14</span></div>
      <div class="live-row"><strong>Suns vs Nuggets</strong><span>Q3 · 0:48</span></div>
      <div class="hint">Live mode will become faster once we add true live streams. For now it gives quick access to in-progress spots.</div>
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
          : `<div class="hint">No picks yet. Tap any odds tile on Home.</div>`
      }
    </section>
  `
}

function renderLeaders() {
  return `
    <section class="panel">
      <div class="panel-head"><h3>Leaderboard</h3></div>
      ${leaderboard.map((row, i) => `
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
          <div class="pick-sub">Level ${state.level} · Rank #${state.rank}</div>
        </div>
      </div>
      <div class="profile-grid">
        <div class="stat-box tall"><span>Total XP</span><strong>${state.xp}</strong></div>
        <div class="stat-box tall"><span>Best Streak</span><strong>${state.streak}</strong></div>
        <div class="stat-box tall"><span>Season Record</span><strong>${state.record}</strong></div>
        <div class="stat-box tall"><span>Open Picks</span><strong>${state.slip.length}</strong></div>
      </div>
    </section>
  `
}

function renderMain() {
  if (state.activeTab === 'home') return renderHome()
  if (state.activeTab === 'live') return renderLive()
  if (state.activeTab === 'picks') return renderPicks()
  if (state.activeTab === 'leaders') return renderLeaders()
  return renderProfile()
}

function sheetContent() {
  if (!state.sheet) return ''
  if (state.sheet.kind === 'details') {
    const game = games.find(g => g.id === state.sheet.payload.id)
    return `
      <div class="sheet-head">
        <div>
          <div class="sheet-title">${game.away} vs ${game.home}</div>
          <div class="pick-sub">${game.start}</div>
        </div>
        <button class="icon-btn" data-close="sheet">×</button>
      </div>
      <div class="sheet-block">
        <div class="market-label">Trend</div>
        <div class="sheet-copy">${game.trend}</div>
      </div>
      <div class="sheet-block">
        <div class="market-label">Insight</div>
        <div class="sheet-copy">${game.note}</div>
      </div>
      <div class="sheet-block">
        <div class="market-label">Quick actions</div>
        <div class="sheet-actions">
          <button class="ghost" data-expand="${game.id}">Expand card</button>
          <button class="ghost" data-close="sheet">Done</button>
        </div>
      </div>
    `
  }
  return `
    <div class="sheet-head">
      <div>
        <div class="sheet-title">Bet slip</div>
        <div class="pick-sub">${state.slip.length} picks ready</div>
      </div>
      <button class="icon-btn" data-close="sheet">×</button>
    </div>
    <div class="sheet-list">
      ${state.slip.length ? state.slip.map(s => `
        <div class="sheet-pick">
          <div>
            <div class="pick-title">${s.value}</div>
            <div class="pick-sub">${s.matchup} · ${s.market}</div>
          </div>
          <button class="icon-btn" data-remove="${s.key}">×</button>
        </div>
      `).join('') : `<div class="hint">Build a slip by tapping odds tiles.</div>`}
    </div>
    <button class="submit" data-submit="slip">Submit picks</button>
  `
}

function renderSheet() {
  if (!state.sheet) return ''
  return `
    <div class="sheet-backdrop" data-close="sheet"></div>
    <section class="sheet">
      <div class="grab"></div>
      ${sheetContent()}
    </section>
  `
}

function renderNav() {
  const items = [
    ['home', 'Home'],
    ['live', 'Live'],
    ['picks', `Picks${state.slip.length ? ` ${state.slip.length}` : ''}`],
    ['leaders', 'Leaders'],
    ['profile', 'Profile']
  ]
  return `
    <nav class="nav">
      ${items.map(([key, label]) => `
        <button class="nav-btn ${state.activeTab === key ? 'active' : ''}" data-tab="${key}">${label}</button>
      `).join('')}
    </nav>
  `
}

function render() {
  app.innerHTML = `
    <div class="shell">
      ${renderHeader()}
      ${renderStatsStrip()}
      <main class="main">${renderMain()}</main>
      <button class="fab" data-slip="open">Slip${state.slip.length ? ` ${state.slip.length}` : ''}</button>
      ${renderNav()}
      ${renderSheet()}
      ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
    </div>
  `
  bind()
}

function bind() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab
      render()
    })
  })
  document.querySelectorAll('[data-expand]').forEach(btn => {
    btn.addEventListener('click', () => toggleExpand(btn.dataset.expand))
  })
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const [id, market, value] = JSON.parse(btn.dataset.add)
      addToSlip(id, market, value)
    })
  })
  document.querySelectorAll('[data-slip]').forEach(btn => {
    btn.addEventListener('click', () => openSheet('slip'))
  })
  document.querySelectorAll('[data-details]').forEach(btn => {
    btn.addEventListener('click', () => openSheet('details', { id: btn.dataset.details }))
  })
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.open
      render()
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

render()
