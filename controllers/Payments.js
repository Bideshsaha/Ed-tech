const {instance} = require('../config/razorpay');
const Course = require('../models/Course');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const {courseEnrollmentEmail} = require('../mail/templates/courseEnrollmentEmail');
const {default: mongoose} = require('mongoose');

//capture thr payment and initiate the razorpay
exports.capturePayment = async(req, res) => {
    // try{
        //get courseid and UserId
        const {course_id} = req.body;
        const userId = req.user.id;
        //validation
        //valid courseID
        if(!course_id){
            return res.json({
                success:false,
                message:"Please provide valid course id"
            });
        }
        //valid courseDetails
        let course;
        try{
            course = await Course.findById(course_id);
            if(!course){
                return res.status(404).json({
                    success:false,
                    message:"Course not found"
                });
            }

            //user already pay for the same course
            const uid = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)){
                return res.status(200).json({
                    success:false,
                    message:"User already enrolled for the course"
                });
            }
        }catch(error){
            return res.status(500).json({
                success:false,
                message:"Error while fetching course details",
                error:error.message,
            });
        }
        
        //order create
        const amount = course.price;
        const currency = "INR";
        const options = {
            amount: amount*100,
            currency,
            receipt: Math.random(Date.now()).toString(),
            notes:{
                courseId:course_id,
                userId,
            }
        }


        try{
            //initiate payment
            const paymentResponse = await instance.orders.create(options);
            console.log(paymentResponse);
            //return response
            return res.status(200).json({
                success:true,
                courseName:course.courseName,
                courseDescription:course.courseDescription,
                thumbnail:course.thumbnail,
                orderId:paymentResponse.id,
                currency:paymentResponse.currency,
                amount:paymentResponse.amount,
                message:"Payment initiated successfully",
            });

        }catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:"Error while initiating payment",
                error:error.message,
            });
        }

        

    // }catch(error){
    //     return res.status(500).json({
    //         success:false,
    //         message:"Error while capturing payment",
    //         error:error.message
    //     }); 
    // }
}

//verify Signature of Razorpay and Server

exports.verifySignature = async(req, res) => {
    const webhookSecret = "12345678";


    const signature = req.headers["x-razorpay-signature"];

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");


    if(signature === digest){
        console.log("Payment verified successfully");


        const {courseId, userId} = req.body.payload.payment.entity.notes;

        try{
            //fulfill the action

            //find the cpurse and enroll the student in this course
            const enrolledCourse = await Course.findOneAndUpdate(
                {_id:courseId},
                {$push:
                    {studentsEnrolled:userId}
                },
                {new:true},
            )

            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:"course not found",
                })
            }
            console.log(enrolledCourse);

            //find the user and update the enrolled courses list
            const enrolledStudent = await User.findOneAndUpdate(
                {_id:userId},
                {$push:
                    {courses:courseId}
                },
                {new:true},
            )

            console.log(enrolledStudent);

            //send mail to the user for course enrollment
            const emailResponse = await mailSender(enrolledStudent.email,
                                                    "Congratulations form codehelp",
                                                "Congratulations! You are enrolled in a new course.");

            console.log(emailResponse);
            return res.status(200).json({
                success:true,
                message:"Payment verified and course enrolled successfully",
            });

        }catch(error){
            console.log(error);
            return res.status(500).json({
                success:false,
                message:"Error while enrolling course",
                error:error.message,
            });
        }
    }else{
        return res.status(400).json({
            success:false,
            message:"Payment verification failed,secret is not matched",
        });
    }
}