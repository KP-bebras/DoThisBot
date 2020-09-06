const TelegramBot = require('node-telegram-bot-api');
const mongoose = require("mongoose");

const config = require('./config.json');

// Database connection
mongoose.connect(`mongodb+srv://bot:${config.db_password}@cluster1.hn9fy.mongodb.net/${config.db_name}?retryWrites=true&w=majority`, { useNewUrlParser: true })
    .then(connected => console.log("Database connection established."))
    .catch(err => console.log("ERROR - Database connection is not established. -- bot.js 9", err));


const User = require('./user_db');
const Suggest = require('./suggest_db');
const Phrase = require('./phrase_db');
const bot = new TelegramBot(config.token, {polling: true});


// @params userId: telegram user id
// Finds user in the database
// @return {is_working, task}
async function findUserIsWorkingAndTask(userId) {
  const user = await User.find(userId)
      .catch(err => botLogger('Error', err.message));
  if (user) return { working: user.is_working, task: user.task};
  return {working: false, task: ""};
}

// @params msg: Message object; userId: telegram user id; isWorking: new working status; task: task string
// Sets user is_working status and/or task string & sends a confirmation message
// @return none
async function setUserWorking(msg, userId, isWorking, task) {
  User.find(userId)
      .then(user => {
        if (user) {
          User.update(userId, isWorking, task)
              .catch(err => botLogger('Error', err.message));
          isWorking ? bot.sendMessage(msg.chat.id, 'Окей, давай по новой', {reply_to_message_id: msg.message_id})
              : bot.sendMessage(msg.chat.id, 'Ну и не делай ничего', {reply_to_message_id: msg.message_id});
        }
        else {
          User.add(userId, isWorking, task)
              .catch(err => botLogger('Error', err.message));
          isWorking ? bot.sendMessage(msg.chat.id, 'Теперь иди ебашь, а то буду доставать', {reply_to_message_id: msg.message_id})
              : bot.sendMessage(msg.chat.id, 'Ты и так ничо не делал', {reply_to_message_id: msg.message_id});
        }
      })
}

// @params type: information type; msg: any information from the bot
// Sends information about errors or other messages from the bot to admins
// @return none
async function botLogger(type, msg)
{
  const logTime = new Date(new Date()
                .toLocaleString("UA", {timeZone: "Europe/Kiev"}))
                .toLocaleTimeString();

  const logInformation = `***Time***: ${logTime} \n***Type***: ${type} \n***Information***: ${msg}`;
  const parse_mode = 'Markdown';
  config.admin_ids.forEach(admin_id =>{
    bot.sendMessage(admin_id, logInformation, { parse_mode });
  });
}

//helper functions
/** Сhecks if there is an ID in the admin config
 * 
 * @param {Number} user_id [user_id]
 * @return {Boolean} check result
 */
function checkIfAdmin(user_id)
{
  if (config.admin_ids.includes(String(user_id))) return true;
  else return false;
}

bot.onText(/\/remind (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const task  = match[1];

  setUserWorking(msg, userId, true, task);
});

bot.onText(/\/stop/, msg => {
  const userId = msg.from.id;

  setUserWorking(msg, userId, false, "");
})

bot.onText(/\/dick/, msg => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
})

bot.onText(/(.+)/, (msg, match) => {
  const userId = msg.from.id;
  const username = msg.from.first_name;

  const message = match[1];
  if (message.includes('/remind')) return;
  if (message.includes('/stop')) return;

  findUserIsWorkingAndTask(userId).then( check => {
    const {working, task} = check;
    if (working) {
      Phrase.getRandomPhrase()
          .then(phrase => {

              const name = `[${String(username)
                  .replace(/]/g,' ')
                  .replace(/\[/g,' ')}](tg://user?id=${userId})`;
              const parse_mode = 'Markdown';

              let phraseTmpl = eval('`'+ phrase[0].text.replace(/`/g,'\\`') +'`');

              bot.sendMessage(msg.chat.id, phraseTmpl, {parse_mode});
          })
          .catch(err => botLogger('Error', err.message));
    }
  })
});


bot.on("callback_query", (callbackQuery) => {
  bot.answerCallbackQuery(callbackQuery.id).then(() => {
    const msg = callbackQuery.message;

    //suggest block
    if(callbackQuery.data.startsWith('sug'))
    {
      const params = callbackQuery.data.split('|');

      if (params[0] === 'sug_last')
      {
        Suggest.getRangeOfEntities(Number(params[1]), 5)
        .then((suggestions) => {
          if (suggestions.length !== 0)
          {
            sendSuggestionsKeyboard(suggestions, 
                                    msg.chat.id, 
                                    Number(params[1]) + 5);
          }
        })
        .catch(err => {
          botLogger('Error', err.message);
        });
        bot.deleteMessage(msg.chat.id, msg.message_id);
      }

      if(params[0] === 'sug')
      {
        if (params[2] === '+')
        {
          Suggest.getEntityById(params[1])
            .then((suggestion) => {
              Phrase.push(suggestion.suggest_text).catch(err => {botLogger('Error', err.message);});

              const name = `[${String(suggestion.author_name)
                .replace(/]/g,' ')
                .replace(/\[/g,' ')}](tg://user?id=${suggestion.author_id})`;
              const parse_mode = 'Markdown';

              bot.sendMessage(suggestion.chat_id, `"${suggestion.suggest_text}" от ${name} был одобрен.`, {parse_mode});

              Suggest.deleteEntityById(params[1]).catch(err => {botLogger('Error', err.message);});
              bot.deleteMessage(msg.chat.id, msg.message_id);
            })
            .catch(err => {
              botLogger('Error', err.message);
            });
        }
        else
        {
          Suggest.deleteEntityById(params[1]);
          bot.deleteMessage(msg.chat.id, msg.message_id);
        }
      }
    }
    //end og suggest block

  });
});

bot.onText(/\/suggest (.+)/, (msg, match) => {
  const suggestion = match[1];
  Suggest.push(suggestion, msg.from.id, msg.from.first_name, msg.chat.id)
         .then(() => {
            bot.deleteMessage(msg.chat.id, msg.message_id);

            const user_name = `[${String(msg.from.first_name)
              .replace(/]/g,' ')
              .replace(/\[/g,' ')}](tg://user?id=${msg.from.id})`;
            const parse_mode = 'Markdown';

            bot.sendMessage(msg.chat.id, user_name + ', "' + suggestion + '" отправлен на рассмотрение', {parse_mode});
         })
         .catch(err => {
            botLogger('Error', err.message);
         });
});

/** Send to admin inline keyboard
 * 
 * @param {Array} suggestArray [array of suggest]
 * @param {Number} chat_id [chat id]
 * @returns {None}
 */
async function sendSuggestionsKeyboard(suggestArray, chat_id, callbackLastIndex, isFirst)
{
  // main keyboard
  for (let suggestObject of suggestArray)
  {
    const buttons = 
    {
      "reply_markup": {
          "inline_keyboard": [
          [
            {
                text: "+",
                callback_data: "sug|" + String(suggestObject._id) + "|+"
            },
            {
                text: "-",
                callback_data: "sug|" + String(suggestObject._id) + "|-"
            }
          ]
        ],
      },
    };

    await bot.sendMessage(chat_id, "\"" + suggestObject.suggest_text + "\"" + 
                     '\nAuthor: ' + suggestObject.author_name, buttons);
  }

  //second 
  if (callbackLastIndex === undefined) callbackLastIndex = suggestArray.length;
  if (!isFirst)
  {
    const buttons = 
    {
      "reply_markup": {
          "inline_keyboard": [
          [
            {
                text: "\\/",
                callback_data: "sug_last|" + String(callbackLastIndex)
            }
          ]
        ],
      },
    };
    bot.sendMessage(chat_id, 'Есчо?', buttons);
  }
}


bot.onText(/\/checkSuggestions/, (msg) => {
  if (checkIfAdmin(msg.from.id))
  {
    Suggest.getRangeOfEntities(0, 5)
      .then((suggestions) => {
        if(suggestions.length === 0) 
          bot.sendMessage(msg.chat.id, 'Новых предложений нет =(');
        else
        {
          const isFirst = suggestions.length < 5;
          sendSuggestionsKeyboard(suggestions, msg.chat.id, suggestions.length, isFirst);
        }
      })
      .catch(err => {
        botLogger('Error', err.message);
    });
  }
});

bot.onText(/\/timer ([0-9]+) (.+)/, (msg, match) => {
  const time = match[1];
  const task = match[2];


})

bot.onText(/\/pullAnAndrey/, msg => {
  if (msg.from.id === config.admin_ids[0]) bot.leaveChat(msg.chat.id);
})
