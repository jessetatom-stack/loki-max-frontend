
const API = "https://loki-web-engine-v2.onrender.com";

const statusEl = document.getElementById("status");
const scoresEl = document.getElementById("scores");

async function load() {
  try {
    const res = await fetch(API + "/api/v1/health");
    const health = await res.json();
    statusEl.innerText = "API LIVE ✅";

    const scoresRes = await fetch(API + "/api/v1/scores?sport=NBA");
    const data = await scoresRes.json();

    scoresEl.innerHTML = "";

    if (!data.games) {
      scoresEl.innerHTML = "<p>No data</p>";
      return;
    }

    data.games.forEach(g => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `
        <h3>${g.home} vs ${g.away}</h3>
        <p>${g.homeScore} - ${g.awayScore}</p>
      `;
      scoresEl.appendChild(div);
    });

  } catch (e) {
    statusEl.innerText = "API ERROR ❌";
  }
}

load();
setInterval(load, 60000);
