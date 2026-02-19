import asyncHandler from "express-async-handler";
import User from "../models/userModel";
import generateToken, { generateRefreshToken } from "../utils/generateToken";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req: any, res: Response) => {
    const keyword = req.query.search
        ? {
            $or: [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
            ],
        }
        : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user?._id } });
    res.send(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, pic } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error("Please Enter all the Feilds");
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        pic,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            pic: user.pic,
            token: generateToken(user._id.toString()),
        });
    } else {
        res.status(400);
        throw new Error("User not found");
    }
});

//@description     Auth the user
//@route           POST /api/user/login
//@access          Public
const authUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    let user: any = await User.findOne({ email });

    // Auto-create guest user if not found
    if (!user && email === 'guest@example.com' && password === '123456') {
        user = await User.create({
            name: 'Guest User',
            email: 'guest@example.com',
            password: '123456',
            pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
        });

        // Create some dummy users for the guest to chat with
        const dummyUsers = [
            { name: "John Doe", email: "john@example.com", password: "password", pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" },
            { name: "Jane Smith", email: "jane@example.com", password: "password", pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" },
            { name: "Alice Johnson", email: "alice@example.com", password: "password", pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" },
            { name: "Bob Brown", email: "bob@example.com", password: "password", pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" },
            { name: "Charlie Davis", email: "charlie@example.com", password: "password", pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" },
        ];

        for (const dummy of dummyUsers) {
            const exists = await User.findOne({ email: dummy.email });
            if (!exists) {
                await User.create(dummy);
            }
        }
    }

    if (user && (await user.matchPassword(password))) {
        const refreshToken = generateRefreshToken(user._id.toString());

        // Set Refresh Token Cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
            sameSite: 'strict', // Prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            pic: user.pic,
            token: generateToken(user._id.toString()),
        });
    } else {
        res.status(401);
        throw new Error("Invalid Email or Password");
    }
});

// @description     Refresh Access Token
// @route           POST /api/user/refresh
// @access          Public (with cookie)
const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const cookies = req.cookies;

    if (!cookies?.jwt) {
        res.status(401);
        throw new Error("No Refresh Token In Cookies");
    }

    const refreshToken = cookies.jwt;

    try {
        const decoded: any = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "refresh_secret");

        // Generate new access token
        const accessToken = generateToken(decoded.id);

        res.json({ token: accessToken });
    } catch (error) {
        res.status(401);
        throw new Error("Invalid Refresh Token");
    }
});

// @description     Update User Profile
// @route           PUT /api/user/profile
// @access          Private
const updateUserProfile = asyncHandler(async (req: any, res: Response) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.pic = req.body.pic || user.pic;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            pic: updatedUser.pic,
            token: generateToken(updatedUser._id.toString()),
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

export { allUsers, registerUser, authUser, refreshAccessToken, updateUserProfile };
