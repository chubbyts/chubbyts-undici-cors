# chubbyts-undici-cors

[![CI](https://github.com/chubbyts/chubbyts-undici-cors/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-undici-cors/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/chubbyts/chubbyts-undici-cors/badge.svg?branch=master)](https://coveralls.io/github/chubbyts/chubbyts-undici-cors?branch=master)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fchubbyts%2Fchubbyts-undici-cors%2Fmaster)](https://dashboard.stryker-mutator.io/reports/github.com/chubbyts/chubbyts-undici-cors/master)
[![npm-version](https://img.shields.io/npm/v/@chubbyts/chubbyts-undici-cors.svg)](https://www.npmjs.com/package/@chubbyts/chubbyts-undici-cors)

[![bugs](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=bugs)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![code_smells](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=code_smells)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![coverage](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=coverage)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![duplicated_lines_density](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=duplicated_lines_density)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![ncloc](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=ncloc)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![sqale_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![alert_status](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=alert_status)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![reliability_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![security_rating](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=security_rating)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![sqale_index](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=sqale_index)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)
[![vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=chubbyts_chubbyts-undici-cors&metric=vulnerabilities)](https://sonarcloud.io/dashboard?id=chubbyts_chubbyts-undici-cors)

## Description

A minimal cors middleware for chubbyts-undici-server.

## Requirements

 * node: 22
 * [@chubbyts/chubbyts-dic-config-factory][5]: ^1.0.0
 * [@chubbyts/chubbyts-dic-types][3]: ^2.3.0
 * [@chubbyts/chubbyts-undici-server][2]: ^1.2.0

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-undici-cors][1].

```ts
npm i @chubbyts/chubbyts-undici-cors@^1.4.0
```

## Usage

```ts
import { createCorsMiddleware } from '@chubbyts/chubbyts-undici-cors/dist/middleware';
import {
  createAllowOriginRegex,
  createHeadersNegotiator,
  createMethodNegotiator,
  createOriginNegotiator,
} from '@chubbyts/chubbyts-undici-cors/dist/negotiation';
import { Handler, Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

const corsMiddleware = createCorsMiddleware(
  createOriginNegotiator([createAllowOriginRegex(/^https?\:\/\/localhost(\:\d+)?$/)]),
  createMethodNegotiator(['GET', 'POST', 'PUT', 'DELETE']),
  createHeadersNegotiator(['Content-Type', 'Accept']),
);

const handler: Handler = async (serverRequest: ServerRequest) => {
  return new Response();
};

(async () => {
  const serverRequest = new ServerRequest();
  const response = await corsMiddleware(serverRequest, handler);
})();
```

**Warning:** When using `createAllowOriginRegex`, always anchor the pattern with `^` and `$` and escape dots. An unanchored pattern like `/example\.com/` also matches unintended origins such as `https://evil-example.com` or `https://example.com.attacker.tld`.

### Service factories (chubbyts-dic-config)

The package ships service factories (abstract factories built on [chubbyts-dic-config-factory][5]) for a [chubbyts-dic-config][4] (or any [chubbyts-dic-types][3] compatible) container within `@chubbyts/chubbyts-undici-cors/dist/service-factory`, configured through `config.chubbyts.cors`:

```ts
import type { ConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import { createContainerByConfigFactory } from '@chubbyts/chubbyts-dic-config/dist/dic-config';
import type { CorsConfig } from '@chubbyts/chubbyts-undici-cors/dist/service-factory';
import { corsMiddlewareServiceFactory } from '@chubbyts/chubbyts-undici-cors/dist/service-factory';
import type { Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';

const container = createContainerByConfigFactory({
  chubbyts: {
    cors: {
      allowOrigins: {
        createAllowOriginExact: ['https://app.example.com'],
        createAllowOriginRegex: [/^https?\:\/\/localhost(\:\d+)?$/],
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowHeaders: ['Content-Type', 'Accept'],
      // exposeHeaders: [],
      // allowCredentials: false,
      // maxAge: 600,
    } satisfies CorsConfig,
  },
  dependencies: {
    factories: new Map<string, ConfigFactory>([['corsMiddleware', corsMiddlewareServiceFactory()]]),
  },
})();

const corsMiddleware = container.get<Middleware>('corsMiddleware');
```

The `corsMiddlewareServiceFactory` uses the services `corsOriginNegotiator`, `corsMethodNegotiator` and `corsHeadersNegotiator` of the container if registered, and creates them through the shipped `originNegotiatorServiceFactory`, `methodNegotiatorServiceFactory` and `headersNegotiatorServiceFactory` otherwise. Register any of them under its name to replace it (e.g. a custom `OriginNegotiator`) or to share it with other services.

#### With names

To serve different parts of an api with different cors rules, the same factories can be registered multiple times with a name: the config is then read from `config.chubbyts.cors.<name>` and the name gets appended to each service id (`corsMiddlewareapi`, `corsOriginNegotiatorapi`, ...).

```ts
const container = createContainerByConfigFactory({
  chubbyts: {
    cors: {
      api: { allowOrigins: { createAllowOriginExact: ['https://app.example.com'] }, allowMethods: ['GET', 'POST'] },
      admin: { allowOrigins: { createAllowOriginExact: ['https://admin.example.com'] }, allowMethods: ['GET', 'DELETE'] },
    } satisfies Record<string, CorsConfig>,
  },
  dependencies: {
    factories: new Map<string, ConfigFactory>([
      ['corsMiddlewareapi', corsMiddlewareServiceFactory('api')],
      ['corsMiddlewareadmin', corsMiddlewareServiceFactory('admin')],
    ]),
  },
})();

const apiCorsMiddleware = container.get<Middleware>('corsMiddlewareapi');
const adminCorsMiddleware = container.get<Middleware>('corsMiddlewareadmin');
```

## Copyright

2026 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-cors
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
[3]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-types
[4]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config
[5]: https://www.npmjs.com/package/@chubbyts/chubbyts-dic-config-factory
