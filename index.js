const bot = require("./lib/mineflayer");
const mineflayer = require("mineflayer");
const checkSyntax = require("./modules/checkSyntax");
const { queryGPT } = require("./lib/openai");
const { showAction } = require("./modules/actionBar");
// const { queryClaude } = require("./lib/claude");

bot.once("login", () => {
  console.log("Logged In.");
});

//history
let chatHistory = [];
const MAX_CHAT_HISTORY = 6;

bot.on("messagestr", async (message, position, jsonMap) => {
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
    const jsonResult = await queryGPT(message, chatHistory);
    // const jsonResult = await queryClaude(message,chatHistory);

    console.log(jsonResult);

    //maximum chat history
    if (chatHistory.length > 2 * (MAX_CHAT_HISTORY - 1)) {
      chatHistory.splice(0, 2);
    }

    //add to chat history
    chatHistory = [
      ...chatHistory,
      {
        role: "user",
        content: [
          {
            type: "text",
            text: message,
          },
        ],
      },
      { role: "assistant", content: [{ type: "text", text: jsonResult?.content }] },
    ];

    actionbar.show({ text: "Executing the task" });

    //run
    async function runCode(code = jsonResult.content) {
      try {
        eval(
          `async function _run() { try { ${code} } catch (e) { bot.chat(\`Oops, error! \${e}\`); const _final = await checkSyntax(jsonResult.content, e); runCode(JSON.parse(_final).content); } }; _run();`
        ); //execute the code
        console.log(`Chat histories: ${chatHistory.length / 2}`);
        actionbar.stopThinking();
      } catch (e) {
        console.log(e);

        bot.chat("Uh oh, it seems an error occurred while executing the task :( I'll try again.");

        //check syntax using ChatGPT
        const final = await checkSyntax(jsonResult.content, e);
        runCode(JSON.parse(final).content);
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
