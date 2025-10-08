// server.js
const express = require("express");
const { connect } = require("../lib/db");

// connect to Mongo first
connect();

const app = express();
app.use(express.json());

// load your routes
app.use("/api", require("../api/message"));
app.use("/api", require("../api/send"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// start providers
require("../lib/providers/discord");
require("../lib/providers/telegram");
