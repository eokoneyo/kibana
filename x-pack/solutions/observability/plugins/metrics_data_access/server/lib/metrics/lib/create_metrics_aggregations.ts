/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { MetricsUIAggregation } from '../../../../common/inventory_models/types';
import type { MetricsAPIRequest } from '../../../../common/http_api/metrics_api';

export const createMetricsAggregations = (options: MetricsAPIRequest): MetricsUIAggregation => {
  const { metrics } = options;
  return metrics.reduce((aggs, metric) => {
    return Object.assign(aggs, metric.aggregations);
  }, {});
};
