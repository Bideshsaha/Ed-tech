const Profile = require('../models/Profile');
const User = require('../models/User');
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updateProfile = async (req, res) => {
    try{
        //fetch data
        const {dateOfBirth="", about="", contactNumber, gender} = req.body;
        //get userid
        const id = req.user.id;
        //validate data
        if(!id || !contactNumber){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            });
        }
        //find profile
        const userDetails = await User.findById(id);
        const profile = await Profile.findById(userDetails.additionalDetails);

        // const profileId = userDetails.additionalDetails;
        // const profileDetails = await Profile.findById(profileId);

        //update profile
        profile.dateOfBirth = dateOfBirth;
        profile.about = about;
        profile.contactNumber = contactNumber;
        // profile.gender = gender;
        await profile.save();
        //return response
        return res.status(200).json({
            success:true,
            message:"Profile updated successfully",
            profile,
        });

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error while updating profile",
            error:error.message
        });
    }
}

//delete account

exports.deleteAccount = async(req, res) => {
    try{
        //get userid
        const id = req.user.id;
        //validate userid
        const user = await User.findById({_id: id});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        //delete profile
        await Profile.findByIdAndDelete({_id: user.userDetails});
        //  todo: unenroll user from all courses
        //delete user
        await User.findByIdAndDelete({_id:id});
        //return response
        return res.status(200).json({
            success:true,
            message:"Account deleted successfully"
        });

    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error while deleting account",
            error:error.message
        });

    }
};

exports.getAllUserDetails = async(req, res) => {
    try{

        //get id
        const id = req.user.id;
        //validation and get user deatils
        const userDetails = await User.findById(id).populate("additionalDetails").exec();
        // return response
        return res.status(200).json({
            success:true,
            message:"User details fetched successfully",
            data:  userDetails,
        }); 


    }catch(error){
        return res.status(500).json({
            success:false,
            message:"Error while fetching user details",
            error:error.message
        });
    }
}

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

exports.getEnrolledCourses = async (req, res) => {
    try {
      const userId = req.user.id
      const userDetails = await User.findOne({
        _id: userId,
      })
        .populate("courses")
        .exec()
      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        data: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};