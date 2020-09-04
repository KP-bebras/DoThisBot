const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    user_id: Number,
    is_working: Boolean,
    task: String
})
const UserModel = mongoose.model("User", userSchema);


class User {
    static async add(id, isWorking = false, task = "") {
        try {
            const savedUser = await new UserModel({user_id: id, is_working: isWorking, task: task}).save();
            console.log("SAVED", savedUser);
        } catch (err) {
            console.log("DATABASE ERROR: User.add() failed -- database.js 23");
            console.log(err);
        }
    }

    static async find(userId) {
        try {
            return await UserModel.findOne({user_id: userId});
        }
        catch (err) {
            console.log("DATABASE ERROR: User.find() failed -- database.js 29");
        }
    }

    static async update(userId, isWorking, task) {
        try {
            return await UserModel.updateOne({user_id: userId}, {is_working: isWorking, task: task})
        }
        catch (err) {
            console.log("DATABASE ERROR: User.update() failed -- database.js 37");
        }

    }
}

module.exports = User;