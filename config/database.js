const mongoose = require("moongoose");
require("dotenv").config();

exports.conect = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology:true,
    })
    .then(() => console.log("DB connected successfully"))
    .catch(() => {
        console.log("DB connection failed")
        console.error(error);
        process.exit(1);
    })
}