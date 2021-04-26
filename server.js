const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5001 });

const connections = [];

const history = [];

wss.on("connection", (ws) => {
  console.log("New connection!");
  connections.push(ws);

  ws.on("message", (message) => {
    console.log(message);
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
