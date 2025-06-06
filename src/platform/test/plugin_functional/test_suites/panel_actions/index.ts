/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { PluginFunctionalProviderContext } from '../../services';

export default function ({
  getService,
  getPageObjects,
  loadTestFile,
}: PluginFunctionalProviderContext) {
  const browser = getService('browser');
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const { common, dashboard } = getPageObjects(['common', 'dashboard']);

  describe('pluggable panel actions', function () {
    before(async () => {
      await browser.setWindowSize(1300, 900);
      await kibanaServer.savedObjects.cleanStandardList();
      await kibanaServer.importExport.load(
        'src/platform/test/functional/fixtures/kbn_archiver/dashboard/current/kibana'
      );
      await esArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/dashboard/current/data'
      );
      await kibanaServer.uiSettings.replace({
        defaultIndex: 'logstash-*',
      });
      await common.navigateToApp('dashboard');
      await dashboard.preserveCrossAppState();
    });

    after(async function () {
      await dashboard.clearSavedObjectsFromAppLinks();
      await kibanaServer.savedObjects.cleanStandardList();
      await esArchiver.unload(
        'src/platform/test/functional/fixtures/es_archiver/dashboard/current/data'
      );
    });

    loadTestFile(require.resolve('./panel_actions'));
  });
}
