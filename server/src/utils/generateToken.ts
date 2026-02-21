import jwt from 'jsonwebtoken';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "default_secret", {
        expiresIn: "30d", // 30 days — frontend stores token in localStorage
    });
};

export const generateRefreshToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || "refresh_secret", {
        expiresIn: "7d", // Long-lived refresh token
    });
};

export default generateToken;
