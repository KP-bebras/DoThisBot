const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PhraseSchema = new Schema({
    text: String
});
const PhraseModel = mongoose.model("Phrase", PhraseSchema);

const Utils = require('./utils');

class Phrase {

    static async push(text) {
        try {
            const savedSuggest = await new PhraseModel({text: text}).save();
        } catch (err) {
            console.log("DATABASE ERROR: Phrase.push() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async getRandomPhrase() {
        try {
            return await PhraseModel.aggregate().sample(1);
            // const docSize = await PhraseModel.count();
            // const randomIndex = Math. Math.random() * docSize
        } catch (err) {
            console.log("DATABASE ERROR: Phrase.push() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }
}

module.exports = Phrase;