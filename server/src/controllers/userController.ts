import asyncHandler from "express-async-handler";
import User from "../models/userModel";
import generateToken, { generateRefreshToken } from "../utils/generateToken";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// Processes search queries to return a list of users matching a given keyword.
// Filters out the currently logged-in user from the results.
// Often used in the front-end when searching for participants to start a new chat with.
const allUsers = asyncHandler(async (req: any, res: Response) => {
    const keyword = req.query.search
        ? {
            $or: [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
            ],
        }
        : {};

    // lean() + limit for fast search — no need to hydrate full Mongoose docs
    const users = await User.find({ ...keyword, _id: { $ne: req.user?._id } })
        .select("name email pic isOnline lastSeen")
        .limit(15)
        .lean();
    res.send(users);
});

// Handles the core registration logic for new accounts.
// Parses requested fields, validates against duplicate emails, hashes the password via pre-save hooks,
// and issues a fresh JWT acting securely as the primary means of session state.
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

    const userData: any = { name, email, password };
    if (pic) {
        userData.pic = pic;
    }

    const user = await User.create(userData);

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

// Authenticates a user based on email and password.
// Explicitly handles the guest login workflow to quickly jumpstart trials by auto-generating dummy chats.
// Issues standard auth metadata payloads back to the client along with HTTP-only scoped refresh tokens.
const authUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    let user: any = await User.findOne({ email });

    // Auto-create guest user if not found — optimized to run dummy user seeding in background
    if (!user && email === 'guest@example.com' && password === '123456') {
        user = await User.create({
            name: 'Guest User',
            email: 'guest@example.com',
            password: '123456',
            pic: 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg',
        });

        // Fire-and-forget: seed dummy users in background so the guest login returns FAST
        const defaultPic = 'https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg';
        const dummyUsers = [
            { name: "John Doe", email: "john@example.com", password: "password", pic: defaultPic },
            { name: "Jane Smith", email: "jane@example.com", password: "password", pic: defaultPic },
            { name: "Alice Johnson", email: "alice@example.com", password: "password", pic: defaultPic },
            { name: "Bob Brown", email: "bob@example.com", password: "password", pic: defaultPic },
            { name: "Charlie Davis", email: "charlie@example.com", password: "password", pic: defaultPic },
        ];

        // Non-blocking: create all dummy users in parallel using insertMany with ordered:false
        // This does NOT block the login response
        (async () => {
            try {
                const bcrypt = await import('bcryptjs');
                const salt = await bcrypt.genSalt(8);
                const hashedDummies = await Promise.all(
                    dummyUsers.map(async (d) => ({
                        ...d,
                        password: await bcrypt.hash(d.password, salt),
                    }))
                );
                // ordered: false means it won't stop on duplicate key errors
                await User.insertMany(hashedDummies, { ordered: false });
            } catch (err: any) {
                // Ignore duplicate key errors (E11000) — users already exist
                if (err.code !== 11000) console.error('Dummy user seeding error:', err);
            }
        })();
    }

    if (user && (await user.matchPassword(password))) {
        const refreshToken = generateRefreshToken(user._id.toString());

        // Set Refresh Token Cookie
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: process.env.NODE_ENV === 'development' ? 'strict' : 'none',
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

// Generates a renewed access token from an interceptor request cleanly without prompting the user.
// Safely pulls from a pre-established HTTP-only cookie containing the 'jwt' refresh token string.
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

// Modifies specific properties on the requester's profile entity.
// Fields can optionally include an image URL, full name payload, or even a brand-new raw password payload.
// If the password is provided, mongoose middleware cleanly intercepts and hashes it again.
const updateUserProfile = asyncHandler(async (req: any, res: Response) => {
    if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Not authorized" });
        return;
    }

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
        res.status(404).json({ message: "User not found" });
    }
});

// Accepts a temporary Google ID token from the frontend and securely verifies it against Google's Auth servers locally.
// If the account does not yet exist within Mongo, it seamlessly creates a phantom SSO account dynamically.
// Finalizes session configuration by appending the HTTP-only scope token onto the returning client request array.
const authGoogleUser = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
        res.status(400);
        throw new Error("No token provided");
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        console.warn("GOOGLE_CLIENT_ID is not set in environment variables!");
        res.status(500);
        throw new Error("Google Login is not fully configured on the server yet");
    }

    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
    } catch (error) {
        res.status(400);
        throw new Error("Invalid or expired Google Token");
    }

    if (!payload || !payload.email) {
        res.status(400);
        throw new Error("Google Login failed (no email found)");
    }

    let user: any = await User.findOne({ email: payload.email });

    if (!user) {
        // Create automatic account
        user = await User.create({
            name: payload.name || "Google User",
            email: payload.email,
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Strong random password
            pic: payload.picture || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
        });
    }

    const refreshToken = generateRefreshToken(user._id.toString());

    // Set Refresh Token Cookie
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'development' ? 'strict' : 'none', // 'none' required for cross-origin
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
});

export { allUsers, registerUser, authUser, refreshAccessToken, updateUserProfile, authGoogleUser };
