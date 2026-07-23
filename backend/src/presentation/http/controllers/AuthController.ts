import type { Request, Response } from 'express';
import {
  registerUserUseCase,
  loginUserUseCase,
  refreshTokensUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  getProfileUseCase,
  updateProfileUseCase,
  changePasswordUseCase,
} from '../../../application/use-cases/auth/index.js';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from '../../../application/dto/auth.dto.js';
import { HttpStatus } from '../../../shared/constants/httpStatus.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class AuthController {
  register = async (req: Request, res: Response) => {
    const result = await registerUserUseCase.execute(req.body as RegisterInput);
    return ApiResponse.created(res, result, 'Registration successful');
  };

  login = async (req: Request, res: Response) => {
    const result = await loginUserUseCase.execute(req.body as LoginInput);
    return ApiResponse.success(res, result, 'Login successful');
  };

  refresh = async (req: Request, res: Response) => {
    const result = await refreshTokensUseCase.execute(req.body as RefreshTokenInput);
    return ApiResponse.success(res, result, 'Token refreshed');
  };

  forgotPassword = async (req: Request, res: Response) => {
    const result = await forgotPasswordUseCase.execute(req.body as ForgotPasswordInput);
    return ApiResponse.success(res, result, result.message);
  };

  resetPassword = async (req: Request, res: Response) => {
    const result = await resetPasswordUseCase.execute(req.body as ResetPasswordInput);
    return ApiResponse.success(res, result, result.message);
  };

  getProfile = async (req: Request, res: Response) => {
    const authUser = requireUser(req);
    const profile = await getProfileUseCase.execute(authUser.id);
    return ApiResponse.success(res, profile, 'Profile retrieved');
  };

  updateProfile = async (req: Request, res: Response) => {
    const authUser = requireUser(req);
    const profile = await updateProfileUseCase.execute(
      authUser.id,
      req.body as UpdateProfileInput,
    );
    return ApiResponse.success(res, profile, 'Profile updated');
  };

  changePassword = async (req: Request, res: Response) => {
    const authUser = requireUser(req);
    const result = await changePasswordUseCase.execute(
      authUser.id,
      req.body as ChangePasswordInput,
    );
    return ApiResponse.success(res, result, result.message, HttpStatus.OK);
  };
}

export const authController = new AuthController();
