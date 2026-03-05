const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

//createRating
exports.createRating = async (req, res) => {
    try{
        //get user id
        const userId = req.user.id;
        //fetchdata form req body
        const {courseId, rating, review} = req.body;

        //validation
        if(!courseId || !rating || !review){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        //check if user enrolled in course or not
        const courseDetails = await Course.findOne({_id:courseId,
                                                    studentsEnrolled: {$elemMatch: {$eq:userId}},
        });
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:"Only enrolled user can review the course",
            })
        }
        //check if user already reviewed the course or not
        const alreadyReviewed = await RatingAndReview.findOne({
            user:userId,
            course:courseId,
        })
        if(alreadyReviewed){
            return res.status(403).json({
                success:false,
                message:"User already reviewed the course",
            })
        }
        //create a rating and review document
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course:courseId,
            user:userId,
        })
        //push the rating and review id into course collection
        const updatedCourseDetails = await Course.findByIdAndUpdate({_id:courseId}, {
            $push: {
                ratingAndReviews: ratingReview._id,
            }
        },
        {new:true});
        console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created successfully",
            ratingReview,
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error while creating rating and review",
            error:error.message,
        })
    }
}


////getAveragerating

exports.getAverageRating = async (req, res) => {
    try{
        //getcourse id
        const courseId = req.body.courseId;
        //calculate avg rating
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: {$avg: "$rating"},
                }
            }
    ]);

    //return rating
    if(result.length > 0){
        return res.status(200).json({
            success:true,
            averageRating: result[0].averageRating,
        })
    }

    //if no ratings found
    return res.status(200).json({
        success:true,
        averageRating: 0,
        message:"No ratings found for this course",
    })
        


    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message: error.message,
        })

    }
}

//getAllratingAndReview

exports.getAllRating = async (req, res) => {
    try{
        const allReviews = await RatingAndReview.find({})
        .sort({rating: "desc"})
        .populate({
            path:"user",
            select:"firstName lastName emailimage",
        })
        .populate({
            path:"course",
            select:"courseName",
        })
        .exec();

        return res.status(200).json({
            success:true,
            message:"All reviews fetched successfully",
            allReviews,
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error while fetching all ratings",
            error:error.message,
        })
    }
}