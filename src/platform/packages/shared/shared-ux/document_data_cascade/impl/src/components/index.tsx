/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { forwardRef, type ComponentProps } from 'react';
import { DataCascadeImpl, type DataCascadeImplProps } from './data_cascade_impl';
import type { DataCascadeImplRef } from '../lib/core/api';
import { DataCascadeProvider, type GroupNode, type LeafNode } from '../store_provider';

export type { GroupNode, LeafNode, DataCascadeImplProps as DataCascadeProps, DataCascadeImplRef };

export { DataCascadeRow, DataCascadeRowCell } from './data_cascade_impl';

export type {
  DataCascadeRowProps,
  DataCascadeRowCellProps,
  CascadeRowCellNestedVirtualizationAnchorProps,
} from './data_cascade_impl';

type DataCascadeProviderProps = ComponentProps<typeof DataCascadeProvider>;

const DataCascadeWithRef = forwardRef<
  DataCascadeImplRef,
  DataCascadeImplProps<GroupNode, LeafNode> & DataCascadeProviderProps
>(function DataCascade({ cascadeGroups, initialGroupColumn, ...props }, ref) {
  return (
    <DataCascadeProvider cascadeGroups={cascadeGroups} initialGroupColumn={initialGroupColumn}>
      <DataCascadeImpl ref={ref} {...props} />
    </DataCascadeProvider>
  );
});

/**
 * Public data cascade component. Forwards the ref to DataCascadeImpl so consumers
 * receive the imperative handle (getStateStore) on the ref.
 */
export const DataCascade = DataCascadeWithRef as <
  G extends GroupNode = GroupNode,
  L extends LeafNode = LeafNode
>(
  props: DataCascadeImplProps<G, L> &
    DataCascadeProviderProps & { ref?: React.Ref<DataCascadeImplRef> }
) => React.ReactElement;
