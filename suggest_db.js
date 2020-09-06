const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const suggestSchema = new Schema({
    suggest_text: String,
    author_id: Number,
    author_name: String,
    chat_id: Number
});
const SuggestModel = mongoose.model("Suggest", suggestSchema);

const Utils = require('./utils');

class Suggest {
    static async push(text, user_id = 0, first_name = '', chatId) {
        try {
            const savedSuggest = await new SuggestModel({suggest_text: text, 
                                                         author_id: user_id,
                                                         author_name: first_name,
                                                         chat_id: chatId}).save();
        } catch (err) {
            console.log("DATABASE ERROR: Suggest.push() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async getAllEntities() {
        try {
            return await SuggestModel.find({});
        }
        catch (err) {
            console.log("DATABASE ERROR: Suggest.getAllEntities() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async getRangeOfEntities(skip, limit){
        try {
            return await SuggestModel.find({}).skip(skip).limit(limit);
        }
        catch (err) {
            console.log("DATABASE ERROR: Suggest.getRangeOfEntities() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async getEntityById(id){
        try {
            return await SuggestModel.findOne({_id : id});
        }
        catch (err) {
            console.log("DATABASE ERROR: Suggest.getEntityById() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async deleteEntityById(id)
    {
        try {
            return await SuggestModel.remove({_id : id});
        }
        catch (err) {
            console.log("DATABASE ERROR: Suggest.deleteEntityById() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }
}


module.exports = Suggest;