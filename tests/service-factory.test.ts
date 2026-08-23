import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import type { Handler, Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from '../src/negotiation';
import type { CorsConfig } from '../src/service-factory';
import {
  corsMiddlewareServiceFactory,
  headersNegotiatorServiceFactory,
  methodNegotiatorServiceFactory,
  originNegotiatorServiceFactory,
} from '../src/service-factory';

// the create functions return opaque closures, so the wiring gets proven by exercising the created services against
// requests and mocked collaborators (negotiators, handler)

const createRequest = (headers: Record<string, string>, method = 'GET') =>
  new ServerRequest('https://api.example.com/resource', { method, headers });

describe('originNegotiatorServiceFactory', () => {
  test('without name, with exact and regex', () => {
    const corsConfig: CorsConfig = {
      allowOrigins: {
        createAllowOriginExact: ['https://app.example.com'],
        createAllowOriginRegex: [/^https?:\/\/localhost(:\d+)?$/],
      },
    };

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: corsConfig } } },
    ]);

    const service = originNegotiatorServiceFactory()(container);

    expect(service(createRequest({ origin: 'https://app.example.com' }))).toBe('https://app.example.com');
    expect(service(createRequest({ origin: 'http://localhost:3000' }))).toBe('http://localhost:3000');
    expect(service(createRequest({ origin: 'https://evil.example.com' }))).toBeUndefined();

    expect(containerMocks).toHaveLength(0);
  });

  test('without allowOrigins', () => {
    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: {} } } },
    ]);

    const service = originNegotiatorServiceFactory()(container);

    expect(service(createRequest({ origin: 'https://app.example.com' }))).toBeUndefined();

    expect(containerMocks).toHaveLength(0);
  });

  test('with name', () => {
    const [container, containerMocks] = useObjectMock<Container>([
      {
        name: 'get',
        parameters: ['config'],
        return: {
          chubbyts: {
            cors: {
              api: { allowOrigins: { createAllowOriginExact: ['https://app.example.com'] } },
              admin: { allowOrigins: { createAllowOriginExact: ['https://admin.example.com'] } },
            },
          },
        },
      },
    ]);

    const service = originNegotiatorServiceFactory('api')(container);

    expect(service(createRequest({ origin: 'https://app.example.com' }))).toBe('https://app.example.com');
    expect(service(createRequest({ origin: 'https://admin.example.com' }))).toBeUndefined();

    expect(containerMocks).toHaveLength(0);
  });
});

describe('methodNegotiatorServiceFactory', () => {
  test('without name', () => {
    const corsConfig: CorsConfig = { allowMethods: ['GET', 'POST'] };

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: corsConfig } } },
    ]);

    const service = methodNegotiatorServiceFactory()(container);

    expect(service.allowMethods).toEqual(['GET', 'POST']);
    expect(service.negotiate(createRequest({ 'access-control-request-method': 'post' }))).toBe(true);
    expect(service.negotiate(createRequest({ 'access-control-request-method': 'DELETE' }))).toBe(false);

    expect(containerMocks).toHaveLength(0);
  });

  test('without allowMethods', () => {
    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: {} } } },
    ]);

    const service = methodNegotiatorServiceFactory()(container);

    expect(service.allowMethods).toEqual([]);

    expect(containerMocks).toHaveLength(0);
  });

  test('with name', () => {
    const [container, containerMocks] = useObjectMock<Container>([
      {
        name: 'get',
        parameters: ['config'],
        return: { chubbyts: { cors: { api: { allowMethods: ['GET'] }, admin: { allowMethods: ['DELETE'] } } } },
      },
    ]);

    const service = methodNegotiatorServiceFactory('admin')(container);

    expect(service.allowMethods).toEqual(['DELETE']);

    expect(containerMocks).toHaveLength(0);
  });
});

describe('headersNegotiatorServiceFactory', () => {
  test('without name', () => {
    const corsConfig: CorsConfig = { allowHeaders: ['Content-Type', 'Accept'] };

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: corsConfig } } },
    ]);

    const service = headersNegotiatorServiceFactory()(container);

    expect(service.allowHeaders).toEqual(['Content-Type', 'Accept']);
    expect(service.negotiate(createRequest({ 'access-control-request-headers': 'content-type, accept' }))).toBe(true);
    expect(service.negotiate(createRequest({ 'access-control-request-headers': 'authorization' }))).toBe(false);

    expect(containerMocks).toHaveLength(0);
  });

  test('without allowHeaders', () => {
    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: {} } } },
    ]);

    const service = headersNegotiatorServiceFactory()(container);

    expect(service.allowHeaders).toEqual([]);

    expect(containerMocks).toHaveLength(0);
  });

  test('with name', () => {
    const [container, containerMocks] = useObjectMock<Container>([
      {
        name: 'get',
        parameters: ['config'],
        return: { chubbyts: { cors: { api: { allowHeaders: ['Accept'] }, admin: { allowHeaders: ['X-Admin'] } } } },
      },
    ]);

    const service = headersNegotiatorServiceFactory('admin')(container);

    expect(service.allowHeaders).toEqual(['X-Admin']);

    expect(containerMocks).toHaveLength(0);
  });
});

describe('corsMiddlewareServiceFactory', () => {
  test('with defaults, without registered services', async () => {
    const config = {
      chubbyts: {
        cors: {
          allowOrigins: { createAllowOriginExact: ['https://app.example.com'] },
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['Content-Type'],
        } satisfies CorsConfig,
      },
    };

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: config },
      { name: 'has', parameters: ['corsOriginNegotiator'], return: false },
      { name: 'get', parameters: ['config'], return: config },
      { name: 'has', parameters: ['corsMethodNegotiator'], return: false },
      { name: 'get', parameters: ['config'], return: config },
      { name: 'has', parameters: ['corsHeadersNegotiator'], return: false },
      { name: 'get', parameters: ['config'], return: config },
    ]);

    const service = corsMiddlewareServiceFactory()(container);

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    // the shipped negotiator factories get used: the configured origin, methods and headers get negotiated
    const response = await service(
      createRequest(
        {
          origin: 'https://app.example.com',
          'access-control-request-method': 'POST',
          'access-control-request-headers': 'Content-Type',
        },
        'OPTIONS',
      ),
      handler,
    );

    expect(response.status).toBe(204);
    expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
      {
        "access-control-allow-headers": "Content-Type",
        "access-control-allow-methods": "GET,POST",
        "access-control-allow-origin": "https://app.example.com",
        "access-control-max-age": "600",
        "vary": "origin",
      }
    `);

    expect(handlerMocks).toHaveLength(0);
    expect(containerMocks).toHaveLength(0);
  });

  test('with options, with registered services', async () => {
    const request = createRequest({ origin: 'https://app.example.com' });
    const response = new Response();

    const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
      { parameters: [request], return: 'https://app.example.com' },
    ]);
    const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);
    const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      { parameters: [request], return: Promise.resolve(response) },
    ]);

    const corsConfig: CorsConfig = { exposeHeaders: ['X-Total-Count'], allowCredentials: true, maxAge: 7200 };

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: corsConfig } } },
      { name: 'has', parameters: ['corsOriginNegotiator'], return: true },
      { name: 'get', parameters: ['corsOriginNegotiator'], return: originNegotiator },
      { name: 'has', parameters: ['corsMethodNegotiator'], return: true },
      { name: 'get', parameters: ['corsMethodNegotiator'], return: methodNegotiator },
      { name: 'has', parameters: ['corsHeadersNegotiator'], return: true },
      { name: 'get', parameters: ['corsHeadersNegotiator'], return: headersNegotiator },
    ]);

    const service = corsMiddlewareServiceFactory()(container);

    // the registered negotiators win over the shipped factories, the options get passed through
    const corsResponse = await service(request, handler);

    expect(Object.fromEntries(corsResponse.headers.entries())).toMatchInlineSnapshot(`
      {
        "access-control-allow-credentials": "true",
        "access-control-allow-origin": "https://app.example.com",
        "access-control-expose-headers": "X-Total-Count",
        "vary": "origin",
      }
    `);

    expect(originNegotiatorMocks).toHaveLength(0);
    expect(methodNegotiatorMocks).toHaveLength(0);
    expect(headersNegotiatorMocks).toHaveLength(0);
    expect(handlerMocks).toHaveLength(0);
    expect(containerMocks).toHaveLength(0);
  });

  test('with name, with registered named services', async () => {
    const request = createRequest({ origin: 'https://admin.example.com' }, 'OPTIONS');

    const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
      { parameters: [request], return: 'https://admin.example.com' },
    ]);
    const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
      { name: 'negotiate', parameters: [request], return: false },
    ]);
    const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
      { name: 'negotiate', parameters: [request], return: false },
    ]);

    const [container, containerMocks] = useObjectMock<Container>([
      { name: 'get', parameters: ['config'], return: { chubbyts: { cors: { admin: { maxAge: 60 } } } } },
      { name: 'has', parameters: ['corsOriginNegotiatoradmin'], return: true },
      { name: 'get', parameters: ['corsOriginNegotiatoradmin'], return: originNegotiator },
      { name: 'has', parameters: ['corsMethodNegotiatoradmin'], return: true },
      { name: 'get', parameters: ['corsMethodNegotiatoradmin'], return: methodNegotiator },
      { name: 'has', parameters: ['corsHeadersNegotiatoradmin'], return: true },
      { name: 'get', parameters: ['corsHeadersNegotiatoradmin'], return: headersNegotiator },
    ]);

    const service = corsMiddlewareServiceFactory('admin')(container);

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const response = await service(request, handler);

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-max-age')).toBe('60');

    expect(originNegotiatorMocks).toHaveLength(0);
    expect(methodNegotiatorMocks).toHaveLength(0);
    expect(headersNegotiatorMocks).toHaveLength(0);
    expect(handlerMocks).toHaveLength(0);
    expect(containerMocks).toHaveLength(0);
  });
});

describe('with container by config', () => {
  test('the services are wired together', async () => {
    const container = createContainerByConfigFactory({
      chubbyts: {
        cors: {
          allowOrigins: { createAllowOriginRegex: [/^https?:\/\/localhost(:\d+)?$/] },
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowHeaders: ['Content-Type', 'Accept'],
          exposeHeaders: ['X-Total-Count'],
          allowCredentials: true,
          maxAge: 7200,
        } satisfies CorsConfig,
      },
      dependencies: {
        factories: new Map<string, ConfigFactory>([
          ['corsMiddleware', corsMiddlewareServiceFactory()],
          ['corsOriginNegotiator', originNegotiatorServiceFactory()],
          ['corsMethodNegotiator', methodNegotiatorServiceFactory()],
          ['corsHeadersNegotiator', headersNegotiatorServiceFactory()],
        ]),
      },
    })();

    const corsMiddleware = container.get<Middleware>('corsMiddleware');

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const response = await corsMiddleware(
      createRequest(
        {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'PUT',
          'access-control-request-headers': 'content-type',
        },
        'OPTIONS',
      ),
      handler,
    );

    expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
      {
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": "Content-Type,Accept",
        "access-control-allow-methods": "GET,POST,PUT,DELETE",
        "access-control-allow-origin": "http://localhost:3000",
        "access-control-expose-headers": "X-Total-Count",
        "access-control-max-age": "7200",
        "vary": "origin",
      }
    `);

    expect(handlerMocks).toHaveLength(0);
  });

  test('the named services are wired together', async () => {
    const container = createContainerByConfigFactory({
      chubbyts: {
        cors: {
          api: { allowOrigins: { createAllowOriginExact: ['https://app.example.com'] }, allowMethods: ['GET'] },
          admin: { allowOrigins: { createAllowOriginExact: ['https://admin.example.com'] }, allowMethods: ['DELETE'] },
        } satisfies Record<string, CorsConfig>,
      },
      dependencies: {
        factories: new Map<string, ConfigFactory>([
          ['corsMiddlewareapi', corsMiddlewareServiceFactory('api')],
          ['corsMiddlewareadmin', corsMiddlewareServiceFactory('admin')],
          ['corsOriginNegotiatorapi', originNegotiatorServiceFactory('api')],
          ['corsOriginNegotiatoradmin', originNegotiatorServiceFactory('admin')],
        ]),
      },
    })();

    const apiMiddleware = container.get<Middleware>('corsMiddlewareapi');
    const adminMiddleware = container.get<Middleware>('corsMiddlewareadmin');

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    // each named middleware negotiates its own origins and methods
    const apiResponse = await apiMiddleware(
      createRequest({ origin: 'https://app.example.com', 'access-control-request-method': 'GET' }, 'OPTIONS'),
      handler,
    );

    expect(apiResponse.headers.get('access-control-allow-origin')).toBe('https://app.example.com');
    expect(apiResponse.headers.get('access-control-allow-methods')).toBe('GET');

    const adminResponse = await adminMiddleware(
      createRequest({ origin: 'https://admin.example.com', 'access-control-request-method': 'DELETE' }, 'OPTIONS'),
      handler,
    );

    expect(adminResponse.headers.get('access-control-allow-origin')).toBe('https://admin.example.com');
    expect(adminResponse.headers.get('access-control-allow-methods')).toBe('DELETE');

    const crossResponse = await adminMiddleware(
      createRequest({ origin: 'https://app.example.com' }, 'OPTIONS'),
      handler,
    );

    expect(crossResponse.headers.get('access-control-allow-origin')).toBeNull();

    expect(handlerMocks).toHaveLength(0);
  });
});
