require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { connect } = require('../db');   // ✅ Mongo connection
const Message = require('../../models/message'); // adjust path if needed

// --- Connect to Mongo for local testing ---
(async () => {
  try {
    await connect();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Event Handlers ---
client.once('ready', () => {
  console.log(`✅ SUCCESS: Discord bot is ready and logged in as ${client.user.tag}!`);
  try {
    client.user.setPresence({
      activities: [{ name: 'your messages', type: ActivityType.Watching }],
      status: 'online',
    });
  } catch (err) {
    console.warn("⚠️ Failed to set presence:", err.message);
  }
});

// --- Listen for incoming messages & save to Mongo ---
client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    console.log(`💬 [${message.channel?.name || "DM"}] ${message.author.tag}: ${message.content}`);

    // Save message to MongoDB
    const newMsg = new Message({
      provider: "discord",
      providerMessageId: message.id,
      providerThreadId: message.channel.id,
      sender: message.author.username,
      text: message.content,
      timestamp: message.createdAt,
    });

    await newMsg.save();
    console.log("✅ Saved Discord message to DB:", newMsg);

    // Test reply
     if (message.content.toLowerCase() === "!ping") {
      await message.reply("pong!");
    }
  } catch (err) {
    // Handle duplicate gracefully
    if (err.code === 11000) {
      console.warn("⚠️ Duplicate message ignored (already saved in DB)");
    } else {
      console.error("❌ Error handling Discord message:", err);
    }
  }
});

// --- Bot Initialization ---
const startBot = async () => {
  try {
    console.log("Attempting to log in the Discord bot...");
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error("❌ Error logging into Discord:", error);
  }
};

if (process.env.DISCORD_BOT_TOKEN) {
  startBot();
} else {
  console.warn("⚠️ DISCORD_BOT_TOKEN not found. Discord bot will not be started.");
}

// --- Exported Functions ---
const sendMessage = async (thread, text) => {
  if (!client.isReady()) {
    console.error('❌ sendMessage failed: Discord bot is not connected or ready.');
    throw new Error('Discord bot is not connected.');
  }
  try {
    const channel = await client.channels.fetch(thread.providerThreadId);
    if (channel) {
      const message = await channel.send(text);
      return message.toJSON();
    }
    throw new Error('Discord channel not found');
  } catch (error) {
    console.error('❌ Discord send message error:', error);
    throw new Error('Failed to send message to Discord');
  }
};

module.exports = { sendMessage, client };
