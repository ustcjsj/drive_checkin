const superagent = require("superagent");
const { logger } = require("./logger");

let WX_PUSHER_UID = process.env.WX_PUSHER_UID;
let WX_PUSHER_APP_TOKEN = process.env.WX_PUSHER_APP_TOKEN;
let serverChanSENDKEY = process.env.SENDKEY;
let telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
let telegramBotId = process.env.TELEGRAM_CHAT_ID;
let feishuBotKey = process.env.FSKEY;

const pushFeishuBot = (title, desp) => {
  if (!feishuBotKey) {
    return;
  }
  logger.info("飞书 服务启动");

  const data = {
    msg_type: "text",
    content: {
      text: `${title}\n\n${desp}`,
    },
  };

  superagent
    .post(`https://open.feishu.cn/open-apis/bot/v2/hook/${feishuBotKey}`)
    .send(data) // superagent 默认会把对象转为 JSON 并设置 Content-Type 为 application/json
    .timeout(3000)
    .then((res) => {
      // 飞书接口成功时会返回 code: 0 或 StatusCode: 0
      const body = res.body || {};
      if (body.StatusCode === 0 || body.code === 0) {
        logger.info("飞书 推送成功！");
      } else {
        logger.error(`飞书 推送失败！错误信息如下：:${JSON.stringify(body)}`);
      }
    })
    .catch((err) => {
      logger.error(`飞书 推送异常:${err}`);
    });
};

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
  pushFeishuBot(title, desp); 
};

exports.push = push;
