import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
    user?: any;
}

const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        res.status(401).json({ message: "Not authorized, no token" });
        return;
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");

        // lean() returns a plain JS object — no Mongoose overhead (getters, change tracking, etc.)
        const user = await User.findById(decoded.id).select("-password").lean();

        if (!user) {
            res.status(401).json({ message: "Not authorized, user not found" });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};

export { protect };
