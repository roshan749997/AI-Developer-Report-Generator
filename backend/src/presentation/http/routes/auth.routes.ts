import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '../validation/auth.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication and user profile
 */
export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *       409:
 *         description: Email already registered
 *       422:
 *         description: Validation error
 */
authRouter.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
authRouter.post('/login', validate({ body: loginSchema }), asyncHandler(authController.login));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Invalid refresh token
 */
authRouter.post(
  '/refresh',
  validate({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh),
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Generic success response (token returned in non-production)
 */
authRouter.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  asyncHandler(authController.forgotPassword),
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
authRouter.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  asyncHandler(authController.resetPassword),
);

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *       401:
 *         description: Unauthorized
 *   patch:
 *     tags: [Auth]
 *     summary: Update authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already in use
 */
authRouter.get('/profile', authenticate, asyncHandler(authController.getProfile));

authRouter.patch(
  '/profile',
  authenticate,
  validate({ body: updateProfileSchema }),
  asyncHandler(authController.updateProfile),
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Unauthorized or incorrect current password
 */
authRouter.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);
