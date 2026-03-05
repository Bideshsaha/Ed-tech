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
        type:[String],
        required: true,
    },
	category: {
		type: mongoose.Schema.Types.ObjectId,
		// required: true,
		ref: "Category",
	},
    studentsEnrolled: [
        {
            type:mongoose.Schema.Types.ObjectId,
            require:true,
            ref:"User",
        }
    ],
	instructions: {
		type: [String],
	},
	status: {
		type: String,
		enum: ["Draft", "Published"],
	},
})

module.exports = mongoose.model("Course", courseSchema);