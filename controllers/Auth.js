const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
//sendotp

exports.sendotp = async(req,res) => {

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

        //check unique otp or not

        const result = await OTP.findOne({otp: otp});
        // console.log("otp generated", otp);
        console.log("Result is Generate OTP Func");
		console.log("OTP", otp);
		console.log("Result", result);

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

exports.signup = async (req,res) => {
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
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log("recent otp is :",recentOtp);
        //validate otp
        if(recentOtp.length === 0){
            return res.status(400).json({
                success:false,
                message:"OTP not found"
            })
        } else if(otp !== recentOtp[0].otp){

            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            })
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        //create db entry
        const profileDetails = await Profile.create({
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
            accountType: accountType,
            additionalDetails:profileDetails._id,
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
        console.log(error);
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
                role: user.role,
            } 
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"24h",
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
                user,
                message:"Logged in Successfully"
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
    try{

    //get data form request body
	const userDetails = await User.findById(req.user.id);
    //get oldpassword, newpassword,confirm newpassword
	const { oldPassword, newPassword, confirmNewPassword } = req.body;
    //validations
    const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        userDetails.password
    );
    if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res
            .status(401)
            .json({ success: false, message: "The password is incorrect" });
    }
    // Match new password and confirm new password
    if (newPassword !== confirmNewPassword) {
        // If new password and confirm new password do not match, return a 400 (Bad Request) error
        return res.status(400).json({
            success: false,
            message: "The password and confirm password does not match",
        });
    }
    //update password in db
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
        req.user.id,
        { password: encryptedPassword },
        { new: true }
    );
    //send mail -- password updated
    try {
        const emailResponse = await mailSender(
            updatedUserDetails.email,
            passwordUpdated(
                updatedUserDetails.email,
                `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
            )
        );
        console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error);
        return res.status(500).json({
            success: false,
            message: "Error occurred while sending email",
            error: error.message,
        });
    }
    //return response
    return res
			.status(200)
			.json({ success: true, message: "Password updated successfully" });

    }catch(error){
        // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		console.error("Error occurred while updating password:", error);
		return res.status(500).json({
			success: false,
			message: "Error occurred while updating password",
			error: error.message,
		});

    }
    
};

