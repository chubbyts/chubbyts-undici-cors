import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { AllowOrigin } from '../src/negotiation';
import {
  createAllowOriginExact,
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '../src/negotiation';

describe('createAllowOriginExact', () => {
  test('match', async () => {
    const allowOriginExact = createAllowOriginExact('https://mydomain.tld');

    expect(allowOriginExact('https://mydomain.tld')).toBe(true);
  });

  test('not match', async () => {
    const allowOriginExact = createAllowOriginExact('http://mydomain.tld');

    expect(allowOriginExact('https://mydomain.tld')).toBe(false);
  });
});

describe('createAllowOriginRegex', () => {
  test('match', async () => {
    const allowOriginRegex = createAllowOriginRegex(/^https:\/\/my/);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(true);
  });

  test('not match', async () => {
    const allowOriginRegex = createAllowOriginRegex(/^http:\/\/my/);

    expect(allowOriginRegex('https://mydomain.tld')).toBe(false);
  });
});

describe('createOriginNegotiator', () => {
  test('missing origin header', async () => {
    const serverRequest = new ServerRequest('https://example.com/');

    const [allowOrigin, allowOriginMocks] = useFunctionMock<AllowOrigin>([]);

    const originNegotiator = createOriginNegotiator([allowOrigin]);

    expect(originNegotiator(serverRequest)).toBe(undefined);

    expect(allowOriginMocks.length).toBe(0);
  });

  test('match', async () => {
    const origin = 'https://mydomain.tld';

    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { origin },
    });

    const [allowOrigin1, allowOrigin1Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const [allowOrigin2, allowOrigin2Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: true }]);

    const originNegotiator = createOriginNegotiator([allowOrigin1, allowOrigin2]);

    expect(originNegotiator(serverRequest)).toBe('https://mydomain.tld');

    expect(allowOrigin1Mocks.length).toBe(0);
    expect(allowOrigin2Mocks.length).toBe(0);
  });

  test('not match', async () => {
    const origin = 'https://mydomain.tld';

    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { origin },
    });

    const [allowOrigin1, allowOrigin1Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const [allowOrigin2, allowOrigin2Mocks] = useFunctionMock<AllowOrigin>([{ parameters: [origin], return: false }]);

    const originNegotiator = createOriginNegotiator([allowOrigin1, allowOrigin2]);

    expect(originNegotiator(serverRequest)).toBe(undefined);

    expect(allowOrigin1Mocks.length).toBe(0);
    expect(allowOrigin2Mocks.length).toBe(0);
  });
});

describe('createMethodNegotiator', () => {
  test('with empty method', () => {
    const serverRequest = new ServerRequest('https://example.com/');

    const methodNegotiator = createMethodNegotiator(['GET', 'POST']);

    expect(methodNegotiator.negotiate(serverRequest)).toBe(false);
  });

  test('with allowed method', () => {
    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { 'access-control-request-method': 'post' },
    });

    const methodNegotiator = createMethodNegotiator(['GET', 'POST']);

    expect(methodNegotiator.negotiate(serverRequest)).toBe(true);
  });

  test('with not allowed method', () => {
    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { 'access-control-request-method': 'put' },
    });

    const methodNegotiator = createMethodNegotiator(['GET', 'POST']);

    expect(methodNegotiator.negotiate(serverRequest)).toBe(false);
  });

  test('get allowed methods', () => {
    const allowMethods = ['GET', 'POST'];

    const methodNegotiator = createMethodNegotiator(allowMethods);

    expect(methodNegotiator.allowMethods).toBe(allowMethods);
  });
});

describe('createHeadersNegotiator', () => {
  test('without headers', () => {
    const serverRequest = new ServerRequest('https://example.com/');

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(false);
  });

  test('with same headers', () => {
    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { 'access-control-request-headers': 'Authorization, Content-Type, Accept' },
    });

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(true);
  });

  test('with same headers lower case', () => {
    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { 'access-control-request-headers': 'authorization, content-Type, accept' },
    });

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(true);
  });

  test('with less headers', () => {
    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { 'access-control-request-headers': 'Authorization' },
    });

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Accept', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(true);
  });

  test('with to many headers', () => {
    const serverRequest = new ServerRequest('https://example.com/', {
      headers: { 'access-control-request-headers': 'Authorization, Accept, Content-Type' },
    });

    const headersNegotiator = createHeadersNegotiator(['Authorization', 'Content-Type']);

    expect(headersNegotiator.negotiate(serverRequest)).toBe(false);
  });

  test('get allowed headers', () => {
    const allowHeaders = ['Authorization', 'Accept', 'Content-Type'];

    const headersNegotiator = createHeadersNegotiator(allowHeaders);

    expect(headersNegotiator.allowHeaders).toBe(allowHeaders);
  });
});
