const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
//sendotp

exports.sendOTP = async(req,res) => {

    try{
        //fetch email form request body
        const {email} = req.body;

        //check if user already exists
        const checkUserPresent = await User.findOne({email});

        //if user already exists, the return a response
        if(checkUserPresent){
            return res.status(401).json({
                success:true,
                message:'User already registered'
            })

        }

        //generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        });

        console.log("otp generated", otp);

        //check unique otp or not

        const result = await otp.findOne({otp: otp});

        while(result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            });
            result = await otp.findOne({otp: otp});
        }

        const otpPayload = {email,otp};
        //create an entry in db for otp

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        res.status(200).json({
            success:true,
            message:"otp sent successfully",
            otp
        })
    }
    catch(error){

        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })

    }
}

//signup

exports.signUp = async (req,res) => {
    try{

        //data fetch form req body
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;

        //data validation
        if(!firstName || !lastName ||!email ||!password ||!confirmPassword ||!otp){
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            })
        }

        //2 password match
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"password and confirm password not matched",
            })
        }
        //check user already exists or not
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User already registered"
            })
        }

        //find most recent otp for the user
        const recentOtp = await OTP.find({email}).Sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
        //validate otp
        if(recentOtp.length == 0){
            return res.status(400).json({
                success:false,
                message:"OTP not found"
            })
        } else if(otp !== recentOtp.otp){
            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            })
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //create db entry
        const pofileDetails = await Profiler.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            conatctNumber:null,
        })
        const user = await User.create({
            firstName, 
            lastName, 
            email, 
            contactNumber, 
            password:hashedPassword, 
            accountType, 
            additionalDetails:pofileDetails._id,
            image:`https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        //return res
        return res.status(200).json({
                success:true,
                message:"User registered Successfully",
                user,
            })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User Cannot be registered. Please try again"
        })
        
    }
}

//login

exports.login = async(req,res) => {
    try{
        //get data form req body
        const {email,password} = req.body;
        //validation data
        if(!email || !password){
            return res.status.json({
                success:true,
                message:"All fields are required , please try again",
            })
        }
        //user check exists or not
        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success:true,
                message:"User is not registerd, please signup first",
            })
        }
        //generate jwt, after password matching
        if(await bcrypt.compare(password, user.password)){

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            } 
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"2h",
            });
            user.token  = token;
            user.password = undefined;

            //create cookie and send response

            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httponly:true,
            }

            res.cookie("token",token, options).status(200).json({
                success:true,
                token,
                user,message:"Logged in Successfully"
            })
        } else {
            return res.status(401).json({
                success:false,
                message:"Password is incorrect"
            })
        }
        

    }catch(error){

        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login failed ! please try again"
        })
    }
}

//changepassword

exports.changePassword = async(req, res) => {
    //get data form request body
    //get oldpassword, newpassword,confirm newpassword
    //validations
    //update password in db
    //send mail -- password updated
    //return response
} 

