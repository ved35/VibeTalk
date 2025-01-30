import { generateToken } from "../lib/utils.js";
import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: "All fields are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: "Password must be at least 6 characters"
            });
        }

        const user = await UserModel.findOne({ email });

        if (user) return res.status(400).json({
            status: 'error',
            message: "Email already exists"
        });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new UserModel({
            fullName,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            // generate jwt token here
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                status: 'success',
                message: 'Sign up success',
                userData: {
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    profilePic: newUser.profilePic,
                }
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: "Invalid user data"
            });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({
            status: 'error',
            message: "Internal Server Error"
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid credentials"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                status: 'error',
                message: "Invalid credentials"
            });
        }

        generateToken(user._id, res);

        res.status(200).json({
            status: 'success',
            message: "Login successfull",
            userData: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic,
            }
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({
            status: 'error',
            message: "Internal Server Error"
        });
    }
};

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({
            status: 'success',
            message: "Logged out successfully"
        });
    } catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({
            status: 'error',
            message: "Internal Server Error"
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({
                status: 'error',
                message: "Profile pic is required"
            });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Update Successfully',
            updateUser: updatedUser
        });
    } catch (error) {
        console.log("error in update profile:", error);
        res.status(500).json({
            status: 'error',
            message: "Internal server error"
        });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json({
            status: 'success',
            message: 'checked Successfully',
            user: req.user
        });
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({
            status: 'error',
            message: "Internal Server Error"
        });
    }
};