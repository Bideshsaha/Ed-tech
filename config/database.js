const mongoose = require("mongoose");

exports.connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ DB connected successfully");
  } catch (error) {
    console.log("❌ DB connection failed");
    console.error(error);
    process.exit(1);
  }
};

// const mongoose = require("mongoose");
// require("dotenv").config();

// exports.connect = () => {
//     mongoose.connect(process.env.MONGODB_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology:true,
//     })
//     .then(() => console.log("DB connected successfully"))
//     .catch((error) => {
//         console.log("DB connection failed")
//         console.log(error);
//         process.exit(1);
//     })
// }