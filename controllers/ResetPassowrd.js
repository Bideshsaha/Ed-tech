const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

//resetPassowrdToekn
exports.resetPasswordToken = async(req, res) => {
    
    try{
        //get email form req body
        const email = req.bosy.email;
        //check user for this email, email validation
        const user = await User.findOne({email: email});
        if(!user){
            return res.json({
                success:false,
                message:"Your Email is not registered with us",
            });
        }
        //genarate token
        const token = crypto.randomUUID();
        //uadate user by adding token and token expiry time
        const upatedDetails = await User.findOneAndUpdate(
            {email: email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 5*60*1000,
            },
            {new:true}
        );
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
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success:false,
                message:"Token expired, please try again",
            });
        }
        //hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        //update password
        await User.findOneAndUpdate(
            {token: token},
            {password: hashedPassword},
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
            success:false,
            message:"Something went wrong while resetting password",
        })
    }
}