const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const servers = {};
const EXPIRE = 20000; // usuarios expiran en 20s

// LIMPIEZA AUTOMÁTICA
function clean() {
  const now = Date.now();

  for (const jobId in servers) {
    for (const uid in servers[jobId]) {
      if (now - servers[jobId][uid].last > EXPIRE) {
        delete servers[jobId][uid];
      }
    }

    if (Object.keys(servers[jobId]).length === 0) {
      delete servers[jobId];
    }
  }
}

// REGISTRAR USUARIO
app.post("/api/track", (req, res) => {
  const { userId, jobId, username } = req.body || {};

  if (!userId || !jobId) {
    return res.status(400).send("ERR");
  }

  if (!servers[jobId]) servers[jobId] = {};

  servers[jobId][userId] = {
    username: username || "Unknown",
    jobId: jobId,
    last: Date.now(),
  };

  res.send("OK");
});

// OBTENER USERS DE UN JOBID
app.get("/api/track", (req, res) => {
  const jobId = req.query.jobId;

  if (!jobId || !servers[jobId]) {
    return res.json([]);
  }

  const ids = Object.keys(servers[jobId]).map(Number);
  res.json(ids);
});

// 🔥 NUEVO: TODOS LOS SERVERS ACTIVOS
app.get("/api/alljobs", (req, res) => {
  res.json(servers);
});

// 🔥 NUEVO: TODOS LOS USUARIOS GLOBALES
app.get("/api/users", (req, res) => {
  let allUsers = [];

  for (const jobId in servers) {
    const users = Object.keys(servers[jobId]).map(Number);
    allUsers = allUsers.concat(users);
  }

  res.json(allUsers);
});

// 🔥 NUEVO: CONTADOR DE USUARIOS
app.get("/api/userCount", (req, res) => {
  let count = 0;

  for (const jobId in servers) {
    count += Object.keys(servers[jobId]).length;
  }

  res.json({ totalUsers: count });
});

// 🔥 NUEVO: CONTADOR DE SERVIDORES
app.get("/api/serverCount", (req, res) => {
  res.json({ totalServers: Object.keys(servers).length });
});

// 🔥 NUEVO: INFORMACIÓN COMPLETA (userId + username + jobId)
app.get("/api/online", (req, res) => {
  const out = [];

  for (const jobId in servers) {
    for (const uid in servers[jobId]) {
      out.push({
        userId: Number(uid),
        username: servers[jobId][uid].username,
        jobId: jobId,
      });
    }
  }

  res.json(out);
});

// 🔥 NUEVO: PANEL HTML VISUAL
app.get("/api/panel", (req, res) => {
  let html = `
  <html>
  <head>
    <title>KANAN USERS PANEL</title>
    <style>
      body { background:#0c0c0c; color:white; font-family:Arial; padding:20px; }
      h1 { color:#00d4ff; }
      table { width:100%; border-collapse:collapse; margin-top:20px; }
      th, td { border:1px solid #444; padding:10px; text-align:left; }
      th { background:#111; }
      tr:hover { background:#1b1b1b; }
    </style>
  </head>
  <body>
    <h1>KANAN USERS — PANEL GLOBAL</h1>
    <h3>Total Servers: ${Object.keys(servers).length}</h3>
    <h3>Total Users: ${Object.values(servers).reduce((a,b)=>a+Object.keys(b).length,0)}</h3>

    <table>
      <tr>
        <th>UserId</th>
        <th>Username</th>
        <th>JobId</th>
      </tr>
  `;

  for (const jobId in servers) {
    for (const uid in servers[jobId]) {
      html += `
        <tr>
          <td>${uid}</td>
          <td>${servers[jobId][uid].username}</td>
          <td>${jobId}</td>
        </tr>
      `;
    }
  }

  html += `
    </table>
  </body>
  </html>
  `;

  res.send(html);
});

// HOME
app.get("/", (req, res) => {
  res.send("KANAN USERS API ONLINE ✔️");
});

// PUERTO RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("KANAN USERS API ACTIVE on port", PORT);
});

// LOOP DE LIMPIEZA
setInterval(clean, 3000);
