const bot = require("./lib/mineflayer");
const mineflayer = require("mineflayer");
const { checkSyntax } = require("./modules/checkSyntax");
const { query } = require("./lib/query");
const { showAction } = require("./modules/actionBar");

bot.once("login", () => {
  console.log("Logged In.");
});

//history
let chatHistory = [];
const MAX_CHAT_HISTORY = 8;

bot.on("messagestr", async (message, position, jsonMap) => {
  if (!message.startsWith(`<${bot.username}>`)) {
    chatHistory.push({
      role: "user",
      content: [
        {
          type: "text",
          text: message,
        },
      ],
    });
  }

  const filterMessage = message.match(/^<(.+?)> (.+)$/);
  if (!filterMessage) return;

  const player = filterMessage[1];
  const playerMessage = filterMessage[2];

  //ignore bot messages
  if (player === bot.username) return;

  //bye
  if (playerMessage.trim().toLowerCase().startsWith("bye gpt")) {
    chatHistory = [];
    bot.chat("Bye!");
    return;
  }

  //calls the bot
  if (chatHistory.length > 0 || playerMessage.trim().toLowerCase().startsWith("hey gpt")) {
    console.log(player + " Asked: " + playerMessage);

    const actionbar = new showAction("GPT is thinking", player);

    actionbar.show();
    actionbar.startThinking();

    //ask AI
    const jsonResult = await query(message, chatHistory);

    console.log(jsonResult);
    if (jsonResult?.status === "error") {
      bot.chat("Error while running the task.");
      actionbar.stopThinking();
      return;
    }

    //maximum chat history
    if (chatHistory.length > MAX_CHAT_HISTORY) {
      chatHistory.splice(0, 2);
    }

    //add AI response to chat history
    chatHistory.push({
      role: "assistant",
      content: [{ type: "text", text: `<${bot.username}> ${jsonResult?.content}` }],
    });

    actionbar.show({ text: "Executing the task" });

    //run
    async function runCode(code = jsonResult.content) {
      try {
        eval(
          `async function _run() { try { ${code} } catch (e) { const _final = await checkSyntax(jsonResult.content, e); _final !== undefined ? runCode(JSON.parse(_final).content) : undefined; } }; _run();`
        ); //execute the code
        console.log(`Chat histories: ${chatHistory.length}`);
        actionbar.stopThinking();
      } catch (e) {
        console.log(e);

        bot.chat("Uh oh, it seems an error occurred while executing the task :( I'll try again.");

        //check syntax using ChatGPT
        const final = await checkSyntax(jsonResult.content, e, actionbar);
        final !== undefined ? runCode(JSON.parse(final).content) : undefined;
      }
    }

    await runCode();
  }
});

bot.on("death", () => {
  bot.chat("I died.");
});

bot.on("spawn", () => {
  bot.chat("Bot spawned.");
});

module.exports = { MAX_CHAT_HISTORY };
