const mineflayer = require("mineflayer");
const { pathfinder } = require("mineflayer-pathfinder");
const navigatePlugin = require("mineflayer-navigate")(mineflayer);
require("dotenv").config();

const bot = mineflayer.createBot({
  host: process.env["MINEFLAYER_HOST"],
  username: process.env["MINEFLAYER_USERNAME"],
  port: parseInt(process.env["MINEFLAYER_PORT"]),
  auth: "offline", //non-licensed account
});

bot.loadPlugins([pathfinder]);
navigatePlugin(bot);

module.exports = bot;
