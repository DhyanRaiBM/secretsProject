const mongoose = require('mongoose');
const argon = require('argon2');
const findOrCreate = require('mongoose-findOrCreate');
function mongoConnect() {
    mongoose
        .connect("mongodb://127.0.0.1:27017/usersDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((err) => console.log("Not connected to MongoDB"));
}
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: Array
});

userSchema.plugin(findOrCreate);

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await argon.hash(this.password);
    }
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = { mongoConnect, User };