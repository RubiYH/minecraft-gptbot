const bot = require("../lib/mineflayer");

class showAction {
  constructor(message, targetPlayer) {
    this.message = message;
    this.targetPlayer = targetPlayer;

    this.jsonText = [{ text: message }];
    this.thinking = null;
  }

  show(jsonMessage) {
    if (jsonMessage) this.jsonText[0] = jsonMessage;
    bot.chat(`/title ${this.targetPlayer} actionbar ${JSON.stringify(this.jsonText)}`);
  }

  startThinking() {
    this.thinking = setInterval(() => {
      if (this.jsonText.length >= 4) {
        this.jsonText = [{ text: this.message }];
      } else {
        this.jsonText.push({ text: " ." });
      }

      this.show();
    }, 1000);
  }

  stopThinking() {
    if (this.thinking) {
      clearInterval(this.thinking);
      bot.chat(`/title ${this.targetPlayer} actionbar {"text":""}`);
    }
  }
}

module.exports = { showAction };
