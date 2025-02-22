/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { DeprecationsDetails, GetDeprecationsContext } from '@kbn/core/server';
import type { Role } from '@kbn/security-plugin-types-common';

export interface PrivilegeDeprecationsRolesByFeatureIdResponse {
  roles?: Role[];
  errors?: DeprecationsDetails[];
}

export interface PrivilegeDeprecationsRolesByFeatureIdRequest {
  context: GetDeprecationsContext;
  featureId: string;
}
export interface PrivilegeDeprecationsService {
  getKibanaRolesByFeatureId: (
    args: PrivilegeDeprecationsRolesByFeatureIdRequest
  ) => Promise<PrivilegeDeprecationsRolesByFeatureIdResponse>;
}
