const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const suggestSchema = new Schema({
    suggest_text: String,
    author_id: Number,
    author_name: String
});
const SuggestModel = mongoose.model("Suggest", suggestSchema);

const Utils = require('./utils');

class Suggest {
    static async push(text, user_id = 0, first_name = '') {
        try {
            const savedSuggest = await new SuggestModel({suggest_text: text, 
                                                         author_id: user_id,
                                                         author_name: first_name}).save();
            console.log("PUSHED ", savedUser);
        } catch (err) {
            console.log("DATABASE ERROR: User.push() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }
}


module.exports = Suggest;