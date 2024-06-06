const { openai } = require("../lib/openai");

const checkSyntax = async (code, error) => {
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
        Please check if there are any syntax errors in the codes below and fix it. For example, if some libraries are missing, you can add some codes to require the libraries.
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
    model: "gpt-4-turbo",
    max_tokens: 4096,
    temperature: 0,
    n: 1,
    response_format: { type: "json_object" },
  });

  console.log(response?.choices[0]?.message?.content);
  return response?.choices[0]?.message?.content;
};

module.exports = checkSyntax;
