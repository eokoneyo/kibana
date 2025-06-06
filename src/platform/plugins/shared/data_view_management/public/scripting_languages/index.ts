/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { estypes } from '@elastic/elasticsearch';
import { i18n } from '@kbn/i18n';
import { HttpStart, NotificationsStart } from '@kbn/core/public';
import { SCRIPT_LANGUAGES_ROUTE_LATEST_VERSION } from '@kbn/data-plugin/common';

export function getSupportedScriptingLanguages(): estypes.ScriptLanguage[] {
  return ['painless'];
}

export function getDeprecatedScriptingLanguages(): estypes.ScriptLanguage[] {
  return [];
}

export const getEnabledScriptingLanguages = (
  http: HttpStart,
  toasts: NotificationsStart['toasts']
) =>
  http
    .get<estypes.ScriptLanguage[]>('/internal/scripts/languages', {
      version: SCRIPT_LANGUAGES_ROUTE_LATEST_VERSION,
    })
    .catch(() => {
      toasts.addDanger(
        i18n.translate('indexPatternManagement.scriptingLanguages.errorFetchingToastDescription', {
          defaultMessage: 'Error getting available scripting languages from Elasticsearch',
        })
      );

      return [] as estypes.ScriptLanguage[];
    });
