// server.js
const express = require("express");
const cors = require("cors");
const { connect } = require("./lib/db");

// connect to Mongo first
connect();

const app = express();

// --- More Explicit CORS Configuration ---
// This allows requests from any origin.
app.use(cors({
  origin: '*'
}));

app.use(express.json());
app.use(express.static('public'));

// load your routes
app.use("/api", require("./api/app/message"));
app.use("/api", require("./api/app/send"));
app.use("/api", require("./api/app/thread"));
app.use("/api/auth", require("./api/auth/login"));
app.use("/api/auth", require("./api/auth/register"));
app.use("/webhooks", require("./api/webhooks/telegram"));
app.use("/webhooks", require("./api/webhooks/discord"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// start providers
require("./lib/providers/discord");
require("./lib/providers/telegram");
