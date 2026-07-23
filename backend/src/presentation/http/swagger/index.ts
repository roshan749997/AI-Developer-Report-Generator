import type { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '../../../config/env.js';
import { swaggerSpec } from './swagger.js';

export function setupSwagger(app: Application): void {
  const docsPath = `${env.API_PREFIX}/docs`;

  app.use(
    docsPath,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'AI Developer Report Generator API',
    }),
  );

  app.get(`${docsPath}.json`, (_req, res) => {
    res.json(swaggerSpec);
  });
}
