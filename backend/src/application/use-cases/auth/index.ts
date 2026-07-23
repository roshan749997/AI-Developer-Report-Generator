import { passwordHasher, jwtTokenService, tokenService } from '../../../infrastructure/security/index.js';
import { userRepository } from '../../../infrastructure/database/repositories/MongoUserRepository.js';
import { RegisterUserUseCase } from './RegisterUserUseCase.js';
import { LoginUserUseCase } from './LoginUserUseCase.js';
import { RefreshTokensUseCase } from './RefreshTokensUseCase.js';
import { ForgotPasswordUseCase } from './ForgotPasswordUseCase.js';
import { ResetPasswordUseCase } from './ResetPasswordUseCase.js';
import { GetProfileUseCase } from './GetProfileUseCase.js';
import { UpdateProfileUseCase } from './UpdateProfileUseCase.js';
import { ChangePasswordUseCase } from './ChangePasswordUseCase.js';

export const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordHasher,
  jwtTokenService,
  tokenService,
);

export const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  passwordHasher,
  jwtTokenService,
  tokenService,
);

export const refreshTokensUseCase = new RefreshTokensUseCase(
  userRepository,
  jwtTokenService,
  tokenService,
);

export const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, tokenService);

export const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepository,
  passwordHasher,
  tokenService,
);

export const getProfileUseCase = new GetProfileUseCase(userRepository);

export const updateProfileUseCase = new UpdateProfileUseCase(userRepository);

export const changePasswordUseCase = new ChangePasswordUseCase(userRepository, passwordHasher);

export {
  RegisterUserUseCase,
  LoginUserUseCase,
  RefreshTokensUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  GetProfileUseCase,
  UpdateProfileUseCase,
  ChangePasswordUseCase,
};
