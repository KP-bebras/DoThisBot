const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PhraseSchema = new Schema({
    text: String
});
const PhraseModel = mongoose.model("Suggest", PhraseSchema);

const Utils = require('./utils');

class Phrase {

    static async push(text) {
        try {
            const savedSuggest = await new SuggestModel({text: text}).save();
        } catch (err) {
            console.log("DATABASE ERROR: Phrase.push() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }
}