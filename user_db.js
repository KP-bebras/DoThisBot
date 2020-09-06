const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    user_id: Number,
    is_working: Boolean,
    task: String,
    timer: {
        timerSet: Date,
        minutes: Number
    }
})
const UserModel = mongoose.model("User", userSchema);

const Utils = require('./utils');

/** Class for working with the User model in the database */
class User {
    /**
     * add() add new User Entity to database
     * @param  {String}  task      [task user is working on]
     * @param  {Boolean} isWorking [if user is working]
     * @param  {Number}  user_id   [user id]
     * @return {Error}             [returns an error if it happened]
    */
    static async add(user_id, isWorking = false, task = "") {
        try {
            const savedUser = await new UserModel({user_id: user_id, is_working: isWorking, task: task}).save();
        } catch (err) {
            console.log("DATABASE ERROR: User.add() failed -- ",
                         Utils.getFile(),
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async find(userId) {
        try {
            return await UserModel.findOne({user_id: userId});
        }
        catch (err) {
            console.log("DATABASE ERROR: User.find() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err);
        }
    }

    static async update(userId, isWorking, task) {
        try {
            return await UserModel.updateOne({user_id: userId}, {is_working: isWorking, task: task})
        }
        catch (err) {
            console.log("DATABASE ERROR: User.update() failed -- ", 
                         Utils.getFile(), 
                         Utils.getLine());
            throw new Error(err.message);
        }

    }
}

module.exports = User;