/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { DeploymentAgnosticFtrProviderContext } from '../../ftr_provider_context';

export default function ({ loadTestFile }: DeploymentAgnosticFtrProviderContext) {
  describe('Serverless Observability feature flag testing - Deployment-agnostic API integration tests', function () {
    loadTestFile(require.resolve('../../apis/alerting/synthetics/synthetics_default_rule'));
    loadTestFile(require.resolve('../../apis/alerting/synthetics/custom_status_rule'));
    loadTestFile(require.resolve('../../apis/alerting/synthetics/alert_on_no_data'));
    loadTestFile(require.resolve('../../apis/alerting/custom_threshold/consumers_and_privileges'));
    loadTestFile(require.resolve('../../apis/alerting/es_query/consumers_and_privileges'));
    loadTestFile(require.resolve('../../apis/alerting/burn_rate/consumers_and_privileges'));
  });
}
