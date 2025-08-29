const superagent = require("superagent");
const { logger } = require("./logger");

let WX_PUSHER_UID = process.env.WX_PUSHER_UID;
let WX_PUSHER_APP_TOKEN = process.env.WX_PUSHER_APP_TOKEN;
let serverChanSENDKEY = process.env.SENDKEY;
let telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
let telegramBotId = process.env.TELEGRAM_CHAT_ID;

const pushServerChan = (title, desp) => {
  if (!serverChanSENDKEY) {
    return;
  }
  const data = {
    title,
    desp: desp.replaceAll("\n","\n\n"),
  };
  superagent
    .post(`https://sctapi.ftqq.com/${serverChanSENDKEY}.send`)
    .type("form")
    .send(data)
    .then((res) => {
      logger.info("ServerChan推送成功");
    })
    .catch((err) => {
      if (err.response?.text) {
        const { info } = JSON.parse(err.response.text);
        logger.error(`ServerChan推送失败:${info}`);
      } else {
        logger.error(`ServerChan推送失败:${JSON.stringify(err)}`);
      }
    });
};

const pushTelegramBot = (title, desp) => {
  if (!(telegramBotToken && telegramBotId)) {
    return;
  }
  const data = {
    chat_id: telegramBotId,
    text: `${title}\n\n${desp}`,
  };
  superagent
  .post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`)
  .type("form")
  .send(data)
  .timeout(3000)
  .then((res) => {
    if (res.body?.ok) {
      logger.info("TelegramBot推送成功");
    } else {
      logger.error(`TelegramBot推送失败:${JSON.stringify(res.body)}`);
    }
  })
  .catch((err) => {
    logger.error(`TelegramBot推送失败:${err}`);
  });
};

const pushWxPusher = (title, desp) => {
  if (!(WX_PUSHER_APP_TOKEN && WX_PUSHER_UID)) {
    return;
  }
  const data = {
    appToken: WX_PUSHER_APP_TOKEN,
    contentType: 1,
    summary: title,
    content: desp,
    uids: [WX_PUSHER_UID],
  };
  superagent
    .post("https://wxpusher.zjiecode.com/api/send/message")
    .send(data)
    .timeout(3000)
    .end((err, res) => {
      if (err) {
        logger.error(`wxPusher推送失败:${JSON.stringify(err)}`);
        return;
      }
      const json = JSON.parse(res.text);
      if (json.data[0].code !== 1000) {
        logger.error(`wxPusher推送失败:${JSON.stringify(json)}`);
      } else {
        logger.info("wxPusher推送成功");
      }
    });
};

const push = (title, desp) => {
  // pushTelegramBot(title, desp);
  // pushServerChan(title, desp);
  pushWxPusher(title, desp);
};

exports.push = push;
