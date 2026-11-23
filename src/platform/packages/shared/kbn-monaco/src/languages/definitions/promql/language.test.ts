/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { monaco } from '../../../monaco_imports';
import { registerLanguage } from '../../helpers';
import { ESQLLang } from '../esql';
import { PromQLLang, PROMQL_LANG_ID } from '.';

// These tests intentionally use the real `monaco-promql` package: the definition is loaded lazily
// via a dynamic import, so a broken import or loader must surface here.
//
// The only stub is the bare `monaco-editor` specifier that `monaco-promql` imports. Jest would
// otherwise resolve it to the AMD bundle (`min/vs/editor/editor.main.js`, which needs `define`);
// point it at the same ESM API module `@kbn/monaco` itself uses so both share one Monaco instance.
jest.mock('monaco-editor', () => jest.requireActual('monaco-editor/editor/editor.api.js'));

const tokenTypes = (line: string, languageId: string) =>
  monaco.editor.tokenize(line, languageId)[0].map((token) => token.type);

describe('PromQLLang', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Languages must be registered with Monaco before their config/tokenizer can be set.
    registerLanguage(PromQLLang);
    registerLanguage(ESQLLang);
  });

  it('lazily loads the real monaco-promql definition and registers its tokenizer', async () => {
    const setTokens = jest.spyOn(monaco.languages, 'setMonarchTokensProvider');
    const setConfig = jest.spyOn(monaco.languages, 'setLanguageConfiguration');

    await expect(PromQLLang.onLanguage?.()).resolves.toBeUndefined();

    expect(setTokens).toHaveBeenCalledWith(
      PROMQL_LANG_ID,
      expect.objectContaining({ tokenizer: expect.any(Object) })
    );
    expect(setConfig).toHaveBeenCalledWith(PROMQL_LANG_ID, expect.any(Object));

    setTokens.mockRestore();
    setConfig.mockRestore();
  });

  it('highlights a PromQL query embedded in an ES|QL PROMQL command', async () => {
    // ES|QL's `onLanguage` awaits `PromQLLang.onLanguage`, so the PromQL tokenizer must be
    // installed by the time the ES|QL language finishes loading. Mirror what Monaco does when a
    // model first uses the language.
    await ESQLLang.onLanguage?.();

    const types = tokenTypes('PROMQL step=1m (rate(http_requests_total[5m]))', ESQLLang.ID);

    // `.promql` suffixed tokens are only produced by the embedded PromQL tokenizer.
    expect(types.some((type) => type.endsWith('.promql'))).toBe(true);
  });
});
