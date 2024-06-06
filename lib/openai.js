const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const queryGPT = async (message, chatHistory) => {
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an expert Minecraft player and a developer, and you are currently in a Minecraft server playing with a player. Your mission to assist the player while playing Minecraft together by answering kindly and also provide actual node.js Mineflayer codes directly when a player requests you some actions.",
      },
      ...chatHistory,
      {
        role: "user",
        content: `
        ## Task
        Please give me the answer for the <question> below;
        <question>
        ${message}
        </question>

        Before you ask, please check the type and process step by step first before answering.
        
        When the player just asks you about some information or simple question, you can just provide solutions or helpful messages. You must answer using the format below;
        
        bot.chat("...");

        But when the player asks you or requests you to do something or when you need some actions, you must write actual node.js Mineflayer codes so that the bot can have actions based on it.
        Before writing codes, make sure you understand the question well, determine the target whether it's you or the player, think of the libraries you need to require before coding, require them first, write codes step by step. Please refer to the official API documentations at https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md. Always add chat feedbacks when executing every step.
        When providing the codes, please skip all the instructions or explanations or beginning parts of coding and just give the actual functioning part of the codes since fundamental codes are already provided. Please refer to the example below for better understanding;

        //Below codes are already given. Read comments for the instruction.

        const bot = require("./lib/mineflayer");
        const mineflayer = require("mineflayer");
        const { pathfinder } = require("mineflayer-pathfinder");
        const navigatePlugin = require("mineflayer-navigate")(mineflayer);

        const bot = mineflayer.createBot({. . .});
          
        bot.loadPlugins([pathfinder]);
        navigatePlugin(bot);

        bot.once("login", () => {
            console.log("Logged In.");
        });

        bot.on(". . .", () => {
            //YOUR CODE GOES HERE!
            //You can require some libraries here first. (e.g. you can require("Vec3") if needed.)
            //
            //For example, if the player asked you for some diamonds, code it like below;
            // const targetPlayer = bot.players[player];
            // if (!targetPlayer) {
            //    bot.chat("I can't see you!");
            //    return;
            // }
            //
            // bot.chat(\`/give \{targetPlayer} minecraft:diamond 64\`);
            // bot.chat(\`Gave diamonds to $\{targetPlayer}.\`);
            // these bot.chat(...) feedbacks are important when executing every task.
        });

        Note that when the player asks you to do something for them, you have to specify the target player, always use 'player' variable as a parameter of the function.
        Since you are an op in the server you can use all the commands in Minecraft so take some advantages of it when necessary. Make sure you set the specific target properly (e.g use 'player' variable instead of @p, use @a if the player asked to do something for everyone, etc.)
        When you need to require libraries, require them. For example, if you need Vec3, require it like 'const vec3 = require("Vec3")')
        Also DONT USE event listeners like 'bot.on(...)' or 'bot.once(...)' because those will not work. Try to write codes that can be executed right away.

        ## Output
        The output must be in a JSON format without any extra explanations and must be one line. Please refer to <output> below;

          <output>
          {
            content: ...
          }
          </output>
        `,
      },
    ],
    model: "gpt-4-turbo",
    max_tokens: 4096,
    temperature: 0.8,
    frequency_penalty: 0.7,
    n: 1,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response?.choices[0]?.message?.content);
};

module.exports = { queryGPT, openai };
