/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { schema } from '@kbn/config-schema';
import { HttpServiceSetup, IRouter } from '@kbn/core/server';
import { isInternalURL } from '@kbn/std';
import { UrlServiceError } from '../../error';
import { ServerUrlService } from '../../types';

export const registerCreateRoute = (
  router: IRouter,
  url: ServerUrlService,
  http: HttpServiceSetup
) => {
  router.post(
    {
      path: '/api/short_url',
      security: {
        authz: {
          enabled: false,
          reason:
            'This route is opted out from authorization, because the url service is a wrapper around the Saved Object client',
        },
      },
      options: {
        access: 'public',
        summary: `Create a short URL`,
      },
      validate: {
        body: schema.object({
          locatorId: schema.string({
            minLength: 1,
            maxLength: 255,
          }),
          slug: schema.string({
            defaultValue: '',
            minLength: 3,
            maxLength: 255,
          }),
          /**
           * @deprecated
           *
           * This field is deprecated as the API does not support automatic
           * human-readable slug generation.
           *
           * @todo This field will be removed in a future version. It is left
           * here for backwards compatibility.
           */
          humanReadableSlug: schema.boolean({
            defaultValue: false,
          }),
          params: schema.object({}, { unknowns: 'allow' }),
        }),
      },
    },
    router.handleLegacyErrors(async (ctx, req, res) => {
      const core = await ctx.core;
      const { locatorId, params, slug } = req.body;
      const locator = url.locators.get(locatorId);

      if (!locator) {
        return res.customError({
          statusCode: 409,
          body: 'Locator not found.',
        });
      }

      const urlFromParams = (params as { url: string | undefined }).url;
      if (urlFromParams && !isInternalURL(urlFromParams)) {
        return res.customError({
          statusCode: 400,
          body: 'Can not create a short URL for an external URL.',
        });
      }

      const savedObjects = core.savedObjects.client;
      const shortUrls = url.shortUrls.get({ savedObjects });

      try {
        const shortUrl = await shortUrls.create({
          locator,
          params,
          slug,
        });

        return res.ok({
          headers: {
            'content-type': 'application/json',
          },
          body: shortUrl.data,
        });
      } catch (error) {
        if (error instanceof UrlServiceError) {
          if (error.code === 'SLUG_EXISTS') {
            return res.customError({
              statusCode: 409,
              body: error.message,
            });
          }
        }
        throw error;
      }
    })
  );
};
