const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5001 });

const connections = [];

const history = [];

wss.on("connection", (ws) => {
  console.log("New connection!");
  connections.push(ws);

  ws.on("message", (message) => {
    // line below is a hack fix for eliminating react sending duplicates
    if (message === JSON.stringify([history[history.length - 1]]))
      return console.log("duplicate skipped");
    history.push(...JSON.parse(message));
    connections
      .filter((client) => client !== ws)
      .forEach((client) => client.send(message));
  });

  ws.on("close", () => {
    const idx = connections.indexOf(ws);
    if (idx !== 1) connections.splice(idx, 1);
  });

  ws.send(JSON.stringify(history));
});
