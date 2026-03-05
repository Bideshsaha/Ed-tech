const Subsection = require("../models/Subsection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//create subsection
exports.createSubSection = async (req, res) => {
    
    try{
        //fetch data
        const {sectionId, title, timeDuration, description} = req.body;
        //extract file/video
        const video = req.files.videoFile;
        //data validation
        if(!sectionId || !title || !timeDuration || !description || !video){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }
        //upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
        //create a new subsection
        const SubSectionDetails = await Subsection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url
        })
        //update section with this subsection objectId
        const updatedSection = await Section.findByIdAndUpdate(
            {_id: sectionId},
            {$push:
                {subSection:SubSectionDetails._id}
            },
            {new:true})
            .populate("subSection");
        //return response

        return res.status(200).json({
            success:true,
            message:"Subsection created successfully",
            data: updatedSection,
        })  
    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error while creating subsection",
            error:error.message
        })
    }

}

//update subsection
//delete subsection
