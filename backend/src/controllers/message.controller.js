import UserModel from "../models/user.model.js";
import MessageModel from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await UserModel.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json({
      status: 'success',
      message: 'Successfull fetch userlist',
      userList: filteredUsers
    });
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({
      status: 'error',
      message: "Internal server error"
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await MessageModel.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfull fetch userlist',
      messageList: messages,
    });
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({
      status: 'error',
      message: "Internal server error"
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new MessageModel({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json({
      status: 'success',
      message: 'Successfull fetch userlist',
      newMessage: newMessage,
    });
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({
      status: 'error',
      message: "Internal server error"
    });
  }
};