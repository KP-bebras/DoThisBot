const TelegramBot = require('node-telegram-bot-api');
const mongoose = require("mongoose");

const config = require('./config.json');

// Database connection
mongoose.connect(`mongodb+srv://bot:${config.db_password}@cluster1.hn9fy.mongodb.net/${config.db_name}?retryWrites=true&w=majority`, { useNewUrlParser: true })
    .then(connected => console.log("Database connection established."))
    .catch(err => console.log("ERROR - Database connection is not established. -- bot.js 9", err));


const User = require('./database');
const Suggest = require('./suggest_db');
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
  const message = match[1];
  if (message.includes('/remind')) return;
  if (message.includes('/stop')) return;

  findUserIsWorkingAndTask(userId).then( check => {
    const {working, task} = check;
    if (working) {
      bot.sendMessage(msg.chat.id, `Ало блять, иди работай, у тебя тут задача: ${task}`, {reply_to_message_id: msg.message_id})
    }
  })
});

bot.onText(/\/suggest (.+)/, (msg, match) => {
  const suggestion = match[1];
  Suggest.push(suggestion, msg.from.id, msg.from.first_name)
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

bot.onText(/\/checkSuggestions/, (msg) => {
  if (checkIfAdmin(msg.from.id))
  {
    Suggest.getAllEntities()
      .then((suggestions) => {

        suggestions.forEach(suggestObject =>
        {
          const buttons = {
            "reply_markup": {
                "inline_keyboard": [
                [
                  {
                      text: "+",
                      callback_data: "+",
                  },
                  {
                      text: "-",
                      callback_data: "-",
                  }
                ]
              ],
            },
          };

          bot.sendMessage(msg.chat.id, suggestObject.suggest_text, buttons);
        });
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
