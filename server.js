const WebSocket = require("ws");
const gifts = require("./src/misc/gifts.json");
const immer = require("immer");

const { produceWithPatches, applyPatches, enablePatches } = immer;

enablePatches();

const initialState = { gifts };

const wss = new WebSocket.Server({ port: 5001 });

const connections = [];

let history = [];

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

function compressHistory(currentPatches) {
  const [, patches] = produceWithPatches(initialState, (draft) => {
    return applyPatches(draft, currentPatches);
  });
  console.log(`compressed from ${currentPatches.length} to ${patches.length}`);
  return patches;
}

setInterval(() => {
  history = compressHistory(history);
}, 5000);
