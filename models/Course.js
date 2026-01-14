const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    
    courseName: {
        type:String,
        trim:true,
    },
    courseDescription: {
        type:String,
        trim:true,
    },
    instructor: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true,
    },
    whatYouWillLearn: {
        type:String,
    },
    courseConttent: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Section",
        }
    ],
    ratingAndReviews: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"RatingAndReview",
        }
    ],
    price: {
        type:Number,
    },
    thumbnail: {
        type:String,
    },
    tag: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tag",
    },
    studentEnrolled: [
        {
            type:mongoose.Schema.Types.ObjectId,
            require:true,
            ref:"User",
        }
    ]
})

module.exports = mongoose.model("Course", courseSchema);