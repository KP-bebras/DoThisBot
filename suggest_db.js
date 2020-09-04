const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const suggestSchema = new Schema({
    text: String,
    author_id: Number,
    first_name: String
});
const SuggestModel = mongoose.model("Suggest", suggestSchema);

class Suggest {
    static async push(text, author_id = 0, first_name = '') {
        try {
            const savedUser = await new UserModel({user_id: id, is_working: isWorking, task: task}).save();
            console.log("SAVED", savedUser);
        } catch (err) {
            console.log("DATABASE ERROR: User.push() failed -- database.js 23");
            console.log(err);
        }
    }
}

module.exports = Suggest;