const { default: axios } = require("axios");

const query = async (message, chatHistory) => {
  try {
    const response = await axios.post("http://localhost:8000/query", {
      msg: message,
      history: chatHistory,
    });

    return {
      status: response?.data?.status,
      content: response?.data?.data,
    };
  } catch (e) {
    console.log(`Error while requesting; ${e.toString()}`);

    return {
      status: "error",
    };
  }
};

module.exports = {
  query,
};
