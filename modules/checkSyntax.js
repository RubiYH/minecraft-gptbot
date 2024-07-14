const { openai } = require("../lib/openai");

let retries = 0;

const checkSyntax = async (code, error, actionbar) => {
  if (retries === 2) {
    retries = 0;
    actionbar?.stopThinking();
    return console.log(`\nRetry failed. Stopped the task.`);
  }

  console.log("\nChecking syntax...\n");

  const response = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert node.js programmer who fixes errors in the code.",
      },
      {
        role: "user",
        content: `
        Please check if there are any syntax errors in the codes below and fix it.
        Currently the error shows: ${error.toString()}
        ${code}
        Give me the result in JSON format without any explanations. Refer to the <output> below;

        <output>
        {
            content: ...
        }
        </output>
        `,
      },
    ],
    model: "gpt-4o",
    max_tokens: 4096,
    temperature: 0,
    n: 1,
    response_format: { type: "json_object" },
  });

  retries++;

  console.log(response?.choices[0]?.message?.content);
  return response?.choices[0]?.message?.content;
};

module.exports = { checkSyntax };
