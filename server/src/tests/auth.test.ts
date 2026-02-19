import { describe, it, expect } from 'vitest';
import generateToken, { generateRefreshToken } from '../utils/generateToken';
import jwt from 'jsonwebtoken';

describe('Auth Utilities', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should generate a valid access token', () => {
        const token = generateToken(userId);
        expect(token).toBeDefined();
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        expect(decoded.id).toBe(userId);
    });

    it('should generate a valid refresh token', () => {
        const token = generateRefreshToken(userId);
        expect(token).toBeDefined();
        const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "refresh_secret");
        expect(decoded.id).toBe(userId);
    });
});
