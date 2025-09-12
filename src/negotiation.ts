import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

export type AllowOrigin = (origin: string) => boolean;

export const createAllowOriginExact = (allowOrigin: string): AllowOrigin => {
  return (origin: string): boolean => {
    return origin === allowOrigin;
  };
};

export const createAllowOriginRegex = (allowOrigin: RegExp): AllowOrigin => {
  return (origin: string): boolean => {
    return origin.match(allowOrigin) !== null;
  };
};

export type OriginNegotiator = (request: ServerRequest) => string | undefined;

export const createOriginNegotiator = (allowOrigins: Array<AllowOrigin>): OriginNegotiator => {
  return (request: ServerRequest): string | undefined => {
    const origin = request.headers.get('origin');

    if (!origin) {
      return undefined;
    }

    for (const allowOrigin of allowOrigins) {
      if (allowOrigin(origin)) {
        return origin;
      }
    }

    return undefined;
  };
};

export type MethodNegotiator = {
  negotiate: (request: ServerRequest) => boolean;
  allowMethods: Array<string>;
};

export const createMethodNegotiator = (allowMethods: Array<string>): MethodNegotiator => {
  return {
    negotiate: (request: ServerRequest): boolean => {
      const accessControlRequestMethod = request.headers.get('access-control-request-method');

      if (!accessControlRequestMethod) {
        return false;
      }

      return allowMethods.some((allowMethod: string) => allowMethod === accessControlRequestMethod.toUpperCase());
    },
    allowMethods,
  };
};

export type HeadersNegotiator = {
  negotiate: (request: ServerRequest) => boolean;
  allowHeaders: Array<string>;
};

export const createHeadersNegotiator = (allowHeaders: Array<string>): HeadersNegotiator => {
  return {
    negotiate: (request: ServerRequest): boolean => {
      const accessControlRequestHeaders = request.headers.get('access-control-request-headers');

      if (!accessControlRequestHeaders) {
        return false;
      }

      return accessControlRequestHeaders.split(',').every((accessControlRequestHeader) => {
        return allowHeaders.some(
          (allowHeader: string) => allowHeader.toUpperCase() === accessControlRequestHeader.trim().toUpperCase(),
        );
      });
    },
    allowHeaders,
  };
};
