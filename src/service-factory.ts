import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import { createAbstractFactory } from '@chubbyts/chubbyts-dic-config-factory/dist/dic-config-factory';
import type { Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createCorsMiddleware } from './middleware.js';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from './negotiation.js';
import {
  createAllowOriginExact,
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from './negotiation.js';

/**
 * The configuration read by the service factories from `config.chubbyts.cors` (or `config.chubbyts.cors.<name>` for
 * named factories), see the arguments of `createOriginNegotiator`, `createMethodNegotiator`,
 * `createHeadersNegotiator` and `createCorsMiddleware`.
 */
export type CorsConfig = {
  allowOrigins?: {
    createAllowOriginExact?: Array<string>;
    createAllowOriginRegex?: Array<RegExp>;
  };
  allowMethods?: Array<string>;
  allowHeaders?: Array<string>;
  exposeHeaders?: Array<string>;
  allowCredentials?: boolean;
  maxAge?: number;
};

type Config = {
  chubbyts: {
    cors: CorsConfig | Record<string, CorsConfig>;
  };
};

export const originNegotiatorServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): OriginNegotiator => {
    const { allowOrigins = {} } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    return createOriginNegotiator([
      ...(allowOrigins.createAllowOriginExact ?? []).map(createAllowOriginExact),
      ...(allowOrigins.createAllowOriginRegex ?? []).map(createAllowOriginRegex),
    ]);
  },
);

export const methodNegotiatorServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): MethodNegotiator => {
    const { allowMethods = [] } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    return createMethodNegotiator(allowMethods);
  },
);

export const headersNegotiatorServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig }): HeadersNegotiator => {
    const { allowHeaders = [] } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    return createHeadersNegotiator(allowHeaders);
  },
);

export const corsMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveConfig, resolveDependency }): Middleware => {
    const { exposeHeaders, allowCredentials, maxAge } = resolveConfig(container.get<Config>('config').chubbyts.cors);

    // a registered service wins over the shipped factory, so that any part can be replaced or shared between services
    return createCorsMiddleware(
      resolveDependency(container, 'corsOriginNegotiator', originNegotiatorServiceFactory),
      resolveDependency(container, 'corsMethodNegotiator', methodNegotiatorServiceFactory),
      resolveDependency(container, 'corsHeadersNegotiator', headersNegotiatorServiceFactory),
      exposeHeaders,
      allowCredentials,
      maxAge,
    );
  },
);
