const Anthropic = require("@anthropic-ai/sdk");
require("dotenv").config();

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"],
});

const queryClaude = async (message, chatHistory) => {
  const response = await anthropic.messages.create({
    system:
      "You are an expert Minecraft player who lives in Minecraft world. You are currently in a Minecraft server playing with a player. Your mission to assist the player while playing Minecraft together by answering kindly and also provide actual node.js Mineflayer codes in a JSON format directly when necessary.",
    messages: [
      ...chatHistory,
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `
          ## Task
          Please give me the answer for the <question> below;
          <question>
          ${message}
          </question>
  
          Before you ask, please check the type and process step by step first before answering.
          
          When the player asks you about some information or simple question, you can just provide solutions or helpful messages. You must answer using the format below;
          
          bot.chat("...");
          return true;
  
          When the player asks you or requests you to do something, you can provide them actual node.js Mineflayer codes from https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md so that the bot can have actions based on it.
          Before writing codes, make sure you understand the question well, determine the target whether it's you or the player. Always add chat messages when executing every steps. 
          When providing the codes, please skip all the instructions or explanations and just give the actual functioning part of the codes. Always return true at the end of that function.
          The codes below is the essential form of the code you need to provide necessarily that catches the error during the runtime of your codes;
  
              try {
                  //your codes based on the question goes here
              } catch (e) {
                  console.log(e)
                  return e;
              }
  
          For example, if the player asks you to dig down 3 blocks, provide some codes that makes a Mineflayer bot actually dig down 3 blocks. Refer to the sample codes below;
          
              try {
                  for (let i = 0; i < 3; i++) {
                      const targetPosition = bot.entity.position.offset(0, -1 - i, 0).floored();
                      const targetBlock = bot.blockAt(targetPosition);
                  
                      if (targetBlock && bot.canDigBlock(targetBlock)) {
                      try {
                          await bot.dig(targetBlock);
                          console.log(\`Dug block at $\{targetPosition}\`);
                      } catch (err) {
                          console.log(\`Error digging block at $\{targetPosition}: $\{err.message}\`);
                          break;
                      }
                      } else {
                      console.log(\`No block to dig at $\{targetPosition}\`);
                      break;
                      }
                  }
  
                  return true;
              } catch (e) {
                  console.log(e)
                  bot.chat("Uh oh, it seems I cant' perform that action right now");
                  return e;
              }
  
          For another example, if the player requests you for some diamonds, you can provide some codes that makes the bot give diamonds to a specific player. Refer to the sample codes below as well;
  
              try {
                  const targetPlayer = bot.players[player];
                  if (!targetPlayer) {
                  bot.chat("I can't see you!");
                  return;
                  }
              
                  bot.chat(\`/give \{targetPlayer} minecraft:diamond 64\`);
                  bot.chat(\`Gave diamonds to $\{targetPlayer}.\`);
  
                  return true;
              } catch (e) {
                  console.log(e)
                  bot.chat("Uh oh, it seems I cant' perform that action right now");
                  return e;
              }
  
          Note that when the player asks you to do something for them, you have to specify the target player, always use 'player' variable as a parameter of the function.
          Since you are an op in the server you can use all the commands in Minecraft so take some advantages of it when necessary. Make sure you set the specific target properly (e.g use 'player' variable instead of @p, use @a if the player asked to do something for everyone, etc.)
          When you need to require libraries, require them. For example, if you need Vec3, require it like 'const vec3 = require("Vec3")')
          Also DONT USE event listeners like 'bot.on(...)' or 'bot.once(...)' because those may not work. Try to write codes that can be executed right away.
  
          ## Output
          The output must be just a raw JSON format without any extra explanations and MUST BE A SINGLE LINE STRING Don't say 'Here is ...', I just want JSON as a result. Please refer to <output> below;
  
          <output>
            {
              "content": "..."
            }
          </output>

          For example, the sample output must be like this;
          {
            "content": "try { bot.chat(\'Hello!\'); } catch (e) { ... }"
          }
          `,
          },
        ],
      },
    ],
    model: "claude-3-opus-20240229",
    max_tokens: 4096,
    temperature: 0,
  });

  return JSON.parse(response?.content?.[0]?.text);
};

module.exports = { queryClaude, anthropic };
