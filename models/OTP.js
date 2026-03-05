const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({

    email: {
        type:String,
        required:true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires: 5*60,
    }

});

// function -> to send email

async function sendVerificationEmail(email, otp) {
    // Create a transporter to send emails

	// Define the email options

	// Send the email
    try{

        const mailResponse = await mailSender(email, "Verification email from Bidesh",emailTemplate(otp));
        console.log("email send Successfully", mailResponse);

    }catch(err){
        console.log("error occur while sendind mail", err);
        throw err;
    }

}

OTPSchema.pre("save", async function(){
    console.log("New document saved to database");

	// Only send an email when a new document is created
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    // next();
})


module.exports = mongoose.model("OTP", OTPSchema);