// const section = require("../models/Section");
const course = require("../models/Course");
const Section = require("../models/Section");

exports.createSection = async (req, res) => {
    try{
        //data fetch
        const {sectionName, courseId} = req.body;
        //data validation
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        //create section
        const newSection = await Section.create({sectionName});
        //update course with section ObjectID
        const updatedCourse = await course.findByIdAndUpdate(
            courseId,
            {$push: 
                {courseContent: newSection._id}
            },
            {new: true}
        ).populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();
        //use populate to replace sections /subsections in the updatedCourseDetails
        // const updatedCourseDetails = await course.findById(courseId).populate("courseContent");

        //return response
        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            updatedCourse,
        })

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to create section",
            error:error.message,
        })
    }

}

exports.updateSection = async (req, res) => {
    try{
        //data fetch
        const {sectionName, sectionId} = req.body;
        //data validation
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:false,
                message:"All fields are required",
            })
        }
        //update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true});
        //return response
        return res.status(200).json({
            success:true,
            message: section,
        })
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Unable to update section",
            error:error.message,
        });
    }
}

exports.deleteSection = async (req, res) => {
    try{
        //get id
        const {sectionId} = req.params;
        //use findByIdAndDelete
        await Section.findByIdAndDelete(sectionId);
        //TODO: do we need to  delete the entry form the course schema ??
        //return response
        return res.status(200).json({
            success:true,
            message:"Section deleted successfully",
        })

    }catch(error){  
        return res.status(500).json({
            success:false,
            message:"Unable to delete section",
            error:error.message,
        });

    }
}