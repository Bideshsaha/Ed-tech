const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

//resetPassowrdToekn
exports.resetPasswordToken = async(req, res) => {
    
    try{
        //get email form req body
        const email = req.body.email;
        //check user for this email, email validation
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
                success:false,
                message:`Your Email: ${email} is not registered with us`,
            });
        }
        //genarate token
        const token = crypto.randomBytes(20).toString("hex");
        //uadate user by adding token and token expiry time
        const updatedDetails = await User.findOneAndUpdate(
            {email: email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 5*60*1000,
            },
            {new:true}
        );
		console.log("DETAILS", updatedDetails);
        //create url
        const url = `http://localhost:3000/update-password/${token}`;
        //send mail conatining the url
        await mailSender(email, "password reset link", `password reset link : ${url}`)
        //return response
        return res.json({
            success:true,
            message:"password reset link has been sent to your email account, please check",
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending reset password link",
        })
    }

    
}

//resetPassword

exports.resetPassword = async(req, res) => {
    try{
        //data fetch
        const {password, confirmPassword, token} = req.body;
        //validation
        if(password !== confirmPassword){
            return res.json({
                success:false,
                message:"Password and Confirm Password does not match",
            });
        }
        //get user details form db using token
        const userDetails = await User.findOne({token: token});
        //if no entry - invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:"This token is invalid, please try again",
            });
        }
        //token time check
        if(!(userDetails.resetPasswordExpires > Date.now())){
            return res.status(403).json({
                success:false,
                message:"Token expired, please try again",
            });
        }
        //hash the password
        const encryptedPassword = await bcrypt.hash(password, 10);

        //update password
        await User.findOneAndUpdate(
            {token: token},
            {password: encryptedPassword},
            {new:true}
        );

        //return response
        return res.status(200).json({
            success:true,
            message:"Password reset successfully, now you can login with new password",
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
			error: error.message,
            success:false,
            message:"Something went wrong while resetting password",
        })
    }
}