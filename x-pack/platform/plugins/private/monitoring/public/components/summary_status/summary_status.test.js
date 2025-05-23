/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiThemeProvider } from '@elastic/eui';
import { renderWithI18nProvider } from '@kbn/test-jest-helpers';
import { SummaryStatus } from './summary_status';

describe('Summary Status Component', () => {
  it('should render metrics in a summary bar', () => {
    const props = {
      metrics: [
        {
          label: 'Free Disk Space',
          value: '173.9 GB',
          'data-test-subj': 'freeDiskSpace',
        },
        {
          label: 'Documents',
          value: '24.8k',
          'data-test-subj': 'documentCount',
        },
      ],
      status: 'green',
    };

    expect(
      renderWithI18nProvider(
        <EuiThemeProvider>
          <SummaryStatus {...props} />
        </EuiThemeProvider>
      )
    ).toMatchSnapshot();
  });

  it('should allow label to be optional', () => {
    const props = {
      metrics: [
        {
          value: '127.0.0.1:9300',
          'data-test-subj': 'transportAddress',
        },
        {
          label: 'Documents',
          value: '24.8k',
          'data-test-subj': 'documentCount',
        },
      ],
      status: 'yellow',
    };

    expect(
      renderWithI18nProvider(
        <EuiThemeProvider>
          <SummaryStatus {...props} />
        </EuiThemeProvider>
      )
    ).toMatchSnapshot();
  });

  it('should allow status to be optional', () => {
    const props = {
      metrics: [
        {
          label: 'Free Disk Space',
          value: '173.9 GB',
          'data-test-subj': 'freeDiskSpace',
        },
        {
          label: 'Documents',
          value: '24.8k',
          'data-test-subj': 'documentCount',
        },
      ],
    };

    expect(
      renderWithI18nProvider(
        <EuiThemeProvider>
          <SummaryStatus {...props} />
        </EuiThemeProvider>
      )
    ).toMatchSnapshot();
  });
});
