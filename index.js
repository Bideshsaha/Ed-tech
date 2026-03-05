const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

const userRoutes = require("./routes/User");
const courseRoutes = require("./routes/Course");
const paymentRoutes = require("./routes/Payments");
const profileRoutes = require("./routes/Profile");


const database = require("./config/database");


const cookiePaeser = require("cookie-parser");
const cors = require("cors");
const {cloudinaryConnect} = require("./config/cloudinary");
const fileUpload = require("express-fileupload");



const PORT = process.env.PORT || 4000;
//connect to database
database.connect();
//middlewares
app.use(express.json());
app.use(cookiePaeser());
app.use(
    cors({
        origin:"http://localhost:3000",
        credentials:true
    })
);
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp"
}))

//cloudinary connection
cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/profile", profileRoutes);

app.get("/", (req, res) => {
    return res.json({
        success:true,
        message:"Welcome to Ed-tech API"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})