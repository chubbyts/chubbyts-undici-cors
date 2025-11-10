# chubbyts-undici-cors

[![CI](https://github.com/chubbyts/chubbyts-undici-cors/workflows/CI/badge.svg?branch=master)](https://github.com/chubbyts/chubbyts-undici-cors/actions?query=workflow%3ACI)
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

 * node: 20
 * [@chubbyts/chubbyts-undici-server][2]: ^1.0.1

## Installation

Through [NPM](https://www.npmjs.com) as [@chubbyts/chubbyts-undici-cors][1].

```ts
npm i @chubbyts/chubbyts-undici-cors@^1.0.0
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

## Copyright

2025 Dominik Zogg

[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-cors
[2]: https://www.npmjs.com/package/@chubbyts/chubbyts-http-types
