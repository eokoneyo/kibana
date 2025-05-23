/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Logger } from '@kbn/logging';
import type {
  RuleExecutorOptions,
  AlertInstanceContext,
  AlertInstanceState,
  RuleType,
  RuleTypeParams,
  RuleTypeState,
} from '@kbn/alerting-plugin/server';
import type { WithoutReservedActionGroups } from '@kbn/alerting-plugin/common';
import type { IRuleDataClient } from '../rule_data_client';
import type { BulkResponseErrorAggregation } from './utils';
import type { AlertWithCommonFieldsLatest } from '../../common/schemas';
import type { SuppressionFieldsLatest } from '../../common/schemas';

export type PersistenceAlertService = <T>(
  alerts: Array<{
    _id: string;
    _source: T;
  }>,
  refresh: boolean | 'wait_for',
  maxAlerts?: number,
  enrichAlerts?: (
    alerts: Array<{
      _id: string;
      _source: T;
    }>,
    params: { spaceId: string }
  ) => Promise<
    Array<{
      _id: string;
      _source: T;
    }>
  >
) => Promise<PersistenceAlertServiceResult<T>>;

export type SuppressedAlertService = <T extends SuppressionFieldsLatest>(
  alerts: Array<{
    _id: string;
    _source: T;
    subAlerts?: Array<{
      _id: string;
      _source: T;
    }>;
  }>,
  suppressionWindow: string,
  enrichAlerts?: (
    alerts: Array<{ _id: string; _source: T }>,
    params: { spaceId: string }
  ) => Promise<Array<{ _id: string; _source: T }>>,
  currentTimeOverride?: Date,
  isRuleExecutionOnly?: boolean,
  maxAlerts?: number
) => Promise<SuppressedAlertServiceResult<T>>;

export interface SuppressedAlertServiceResult<T> extends PersistenceAlertServiceResult<T> {
  suppressedAlerts: Array<{ _id: string; _source: T }>;
}

export interface PersistenceAlertServiceResult<T> {
  createdAlerts: Array<AlertWithCommonFieldsLatest<T> & { _id: string; _index: string }>;
  errors: BulkResponseErrorAggregation;
  alertsWereTruncated: boolean;
}

export interface PersistenceServices {
  alertWithPersistence: PersistenceAlertService;
  alertWithSuppression: SuppressedAlertService;
}

export type PersistenceAlertType<
  TParams extends RuleTypeParams,
  TState extends RuleTypeState,
  TInstanceContext extends AlertInstanceContext = {},
  TActionGroupIds extends string = never
> = Omit<
  RuleType<TParams, TParams, TState, AlertInstanceState, TInstanceContext, TActionGroupIds>,
  'executor'
> & {
  executor: (
    options: RuleExecutorOptions<
      TParams,
      TState,
      AlertInstanceState,
      TInstanceContext,
      WithoutReservedActionGroups<TActionGroupIds, never>
    > & {
      services: PersistenceServices;
    }
  ) => Promise<{ state: TState }>;
};

export type CreatePersistenceRuleTypeWrapper = (options: {
  ruleDataClient: IRuleDataClient;
  logger: Logger;
  formatAlert?: (alert: unknown) => unknown;
}) => <TParams extends RuleTypeParams, TState extends RuleTypeState>(
  type: PersistenceAlertType<TParams, TState, AlertInstanceContext, 'default'>
) => RuleType<TParams, TParams, TState, AlertInstanceState, AlertInstanceContext, 'default'>;
