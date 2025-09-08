import { expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { HeadersNegotiator, MethodNegotiator, OriginNegotiator } from '../src/negotiation';
import { createCorsMiddleware } from '../src/middleware';

test('preflight without origin', async () => {
  const serverRequest = new ServerRequest('https://example.com', { method: 'OPTIONS' });

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(originNegotiator, methodNegotiator, headersNegotiator);

  const response = await middleware(serverRequest, handler);

  expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot('{}');

  expect(handlerMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('preflight with origin, without method, without headers', async () => {
  const serverRequest = new ServerRequest('https://example.com', { method: 'OPTIONS' });

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: false },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: false },
  ]);

  const middleware = createCorsMiddleware(originNegotiator, methodNegotiator, headersNegotiator);

  const response = await middleware(serverRequest, handler);

  expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
    {
      "access-control-allow-credentials": "false",
      "access-control-allow-origin": "https://mydomain.tld",
      "access-control-max-age": "600",
    }
  `);

  expect(handlerMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('preflight with origin, with method, with headers, minimal', async () => {
  const serverRequest = new ServerRequest('https://example.com', { method: 'OPTIONS' });

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowMethods', value: ['GET', 'POST'] },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowHeaders', value: ['Accept', 'Content-Type'] },
  ]);

  const middleware = createCorsMiddleware(originNegotiator, methodNegotiator, headersNegotiator);

  const response = await middleware(serverRequest, handler);

  expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
    {
      "access-control-allow-credentials": "false",
      "access-control-allow-headers": "Accept,Content-Type",
      "access-control-allow-methods": "GET,POST",
      "access-control-allow-origin": "https://mydomain.tld",
      "access-control-max-age": "600",
    }
  `);

  expect(handlerMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('preflight with origin, with method, with headers, maximal', async () => {
  const serverRequest = new ServerRequest('https://example.com', { method: 'OPTIONS' });

  const [handler, handlerMocks] = useFunctionMock<Handler>([]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowMethods', value: ['GET', 'POST'] },
  ]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([
    { name: 'negotiate', parameters: [serverRequest], return: true },
    { name: 'allowHeaders', value: ['Accept', 'Content-Type'] },
  ]);

  const middleware = createCorsMiddleware(
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    ['X-Unknown'],
    true,
    7200,
  );

  const response = await middleware(serverRequest, handler);

  expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
    {
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "Accept,Content-Type",
      "access-control-allow-methods": "GET,POST",
      "access-control-allow-origin": "https://mydomain.tld",
      "access-control-expose-headers": "X-Unknown",
      "access-control-max-age": "7200",
    }
  `);

  expect(handlerMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('handle without origin', async () => {
  const serverRequest = new ServerRequest('https://example.com', { method: 'POST' });

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(new Response()) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: undefined },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    ['X-Unknown'],
    true,
    7200,
  );

  const response = await middleware(serverRequest, handler);

  expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot('{}');

  expect(handlerMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});

test('handle with origin', async () => {
  const serverRequest = new ServerRequest('https://example.com', { method: 'POST' });

  const [handler, handlerMocks] = useFunctionMock<Handler>([
    { parameters: [serverRequest], return: Promise.resolve(new Response()) },
  ]);

  const [originNegotiator, originNegotiatorMocks] = useFunctionMock<OriginNegotiator>([
    { parameters: [serverRequest], return: 'https://mydomain.tld' },
  ]);

  const [methodNegotiator, methodNegotiatorMocks] = useObjectMock<MethodNegotiator>([]);

  const [headersNegotiator, headersNegotiatorMocks] = useObjectMock<HeadersNegotiator>([]);

  const middleware = createCorsMiddleware(
    originNegotiator,
    methodNegotiator,
    headersNegotiator,
    ['X-Unknown'],
    true,
    7200,
  );

  const response = await middleware(serverRequest, handler);

  expect(Object.fromEntries(response.headers.entries())).toMatchInlineSnapshot(`
    {
      "access-control-allow-credentials": "true",
      "access-control-allow-origin": "https://mydomain.tld",
      "access-control-expose-headers": "X-Unknown",
    }
  `);

  expect(handlerMocks.length).toBe(0);
  expect(originNegotiatorMocks.length).toBe(0);
  expect(methodNegotiatorMocks.length).toBe(0);
  expect(headersNegotiatorMocks.length).toBe(0);
});
