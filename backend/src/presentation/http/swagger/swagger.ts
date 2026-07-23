import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../../../config/env.js';

const apiBase = `http://localhost:${env.PORT}${env.API_PREFIX}`;

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'AI Developer Report Generator API',
      version: '1.0.0',
      description:
        'API for authentication, projects, Git scanning, schedulers, and AI report generation.',
    },
    servers: [
      {
        url: apiBase,
        description: 'Local API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Role: {
          type: 'string',
          enum: ['developer', 'manager', 'admin'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '665f1c2a9b1e4a0012abcdef' },
            name: { type: 'string', example: 'Jane Doe' },
            email: { type: 'string', format: 'email', example: 'jane@example.com' },
            role: { $ref: '#/components/schemas/Role' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            accessTokenExpiresIn: { type: 'string', example: '15m' },
            refreshTokenExpiresIn: { type: 'string', example: '7d' },
          },
        },
        AuthSuccessData: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            tokens: { $ref: '#/components/schemas/AuthTokens' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Must include letters and numbers',
            },
            role: { $ref: '#/components/schemas/Role' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'password'],
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 8 },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            localGitPath: { type: 'string', example: 'E:/repos/my-app' },
            gitBranch: { type: 'string', example: 'main' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            isEnabled: { type: 'boolean' },
            ownerId: { type: 'string' },
            lastValidatedAt: { type: 'string', format: 'date-time', nullable: true },
            lastConnectionStatus: {
              type: 'string',
              enum: ['success', 'failed'],
              nullable: true,
            },
            lastConnectionMessage: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateProjectRequest: {
          type: 'object',
          required: ['name', 'localGitPath', 'gitBranch'],
          properties: {
            name: { type: 'string' },
            localGitPath: { type: 'string' },
            gitBranch: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            validateGit: { type: 'boolean', default: true },
          },
        },
        UpdateProjectRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            localGitPath: { type: 'string' },
            gitBranch: { type: 'string' },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            validateGit: { type: 'boolean', default: true },
          },
        },
        ValidateGitRequest: {
          type: 'object',
          required: ['localGitPath', 'gitBranch'],
          properties: {
            localGitPath: { type: 'string' },
            gitBranch: { type: 'string' },
          },
        },
        TestConnectionRequest: {
          type: 'object',
          required: ['localGitPath', 'gitBranch'],
          properties: {
            localGitPath: { type: 'string' },
            gitBranch: { type: 'string' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            details: {},
            path: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      parameters: {
        ProjectId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string' },
        },
      },
    },
  },
  apis: [
    './src/presentation/http/routes/*.ts',
    './dist/presentation/http/routes/*.js',
  ],
});
