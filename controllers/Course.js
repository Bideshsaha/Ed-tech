const Course = require('../models/Course');
// const Tag = required("../models/tags");
const Category = require("../models/Category");
const User = require("../models/User");
const { uploadImageToCloudinary } = require('../utils/imageUploader');

//createCouse handler function

exports.createCourse = async (req, res) => {
    try{

        // Get user ID from request object
		const userId = req.user.id;

        //fetch data
        const {courseName, courseDescription, whatYouWillLearn, 
            price, tag, category,status,instructions} = req.body;

        //get thumbnail
        const thumbnail = req.files.thumbnailImage;

        //validation
        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail || !category){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        if(!status || status === undefined) {
            status = "Draft";
        }

        //check for instructor
        // const userId = req.user.id;
        // const instructorDetails = await User.findById(userId);
        // console.log(instructorDetails);

        const instructorDetails = await User.findById(userId, {
			accountType: "Instructor",
		});
        //TODO: verify that userID and instructor._ID are same or not 

        if(!instructorDetails){
            return res.status(404).json({
                success:false,
                message:"Instructor Details not found",
            })
        }

        //check given tag is valid or not
        const categoryDetails = await Category.findById(category);

        if(!categoryDetails){
            return res.status(404).json({
                success:false,
                message:"Category not found",
            })
        }

        //upload iimage to cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail,process.env.FOLDER_NAME);

		console.log(thumbnailImage);
        //create an extry for new course

        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            thumbnail: thumbnailImage.secure_url,
            tag: tag,
            category: categoryDetails._id,
            status: status,
            instructions: instructions,

        })
        console.log(newCourse);

        //add the new course to the instructor's list of courses
        await User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {$push: 
                {courses: newCourse._id}
            },
            {new:true},
        )

        //update the category schema to include the new course
        await Category.findByIdAndUpdate(
            {_id: category},
            {$push: 
                {courses: newCourse._id}
            },
            {new:true},
        )   

        //return response
        return res.status(200).json({
            success:true,
            message:"Course created successfully",
            data:newCourse,
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"failed to create course",
            error:error.message,
        })
    }
}

//getAllCourses handler function

exports.getAllCourses = async (req, res) => {
    try{
        const allcourses = await Course.find({},
            {   
                courseName:true, 
                instructor:true, 
                price:true, 
                thumbnail:true, 
                ratingAndReviews:true, 
                studentsEnrolled:true}).populate("instructor").exec();

        return res.status(200).json({
            success:true,
            message:"All courses fetched successfully",
            data:allcourses,
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Failed to fetch courses",
            error:error.message,
        })
    }
}

//getCourseDetails
exports.getCourseDetails = async( req, res) =>{
    try{
        //get ID
        const {courseId} = req.body;
        //find course details
        const courseDetails = await Course.findById({_id: courseId})
        .populate(
            {
                path:"instructor",
                populate:{
                    path:"additionalDetails",
                }
            }
        )
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path:"courseContent",
            populate:{
                path:"subSection",
            },
        })
        .exec();

        //validation
        if(!courseDetails){
            return res.status(404).json({
                success:false,
                message:`Course not found the course with ${courseId}`,
            })
        }
        //return response
        return res.status(200).json({
            success:true,
            message:"Course details fetched successfully",
            data:courseDetails,
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to fetch course details",
            error:error.message,
        })
    }
}