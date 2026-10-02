/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React, { type HTMLAttributes } from 'react';
import { css } from '@emotion/react';
import { useEuiTheme, euiSlightShadowHover, type EuiThemeComputed } from '@elastic/eui';
import classNames from 'classnames';
import type { TabsServices } from '../../types';

export interface TabWithBackgroundProps extends HTMLAttributes<HTMLElement> {
  isSelected: boolean;
  isDragging?: boolean;
  isLoading?: boolean;
  hideRightSeparator?: boolean;
  services: TabsServices;
  children: React.ReactNode;
}

export const TabWithBackground = React.forwardRef<HTMLDivElement, TabWithBackgroundProps>(
  (
    { isSelected, isDragging, isLoading, hideRightSeparator, services, children, ...otherProps },
    ref
  ) => {
    const euiThemeContext = useEuiTheme();
    const { euiTheme } = euiThemeContext;

    return (
      <div
        {...otherProps}
        ref={ref}
        className={classNames('unifiedTabs__tabWithBackground', {
          'unifiedTabs__tabWithBackground--selected': isSelected,
        })}
        // tab main background and another background color on hover
        css={css`
          position: relative;
          display: inline-block;
          border-radius: ${euiTheme.border.radius.small};
          background: ${isSelected || isDragging
            ? euiTheme.colors.backgroundBasePlain
            : 'transparent'};
          transition: background ${euiTheme.animation.fast};
          margin: ${euiTheme.size.xs};
          // overlap the container's bottom border so the active tab connects to the content below
          margin-bottom: -${euiTheme.border.width.thin};
          padding-bottom: ${isDragging ? '0' : euiTheme.size.xs};
          // Reserve space for the selected tab's borders so it does not shift layout.
          border-top: ${euiTheme.border.width.thick} solid transparent;
          border-left: ${euiTheme.border.width.thin} solid transparent;
          border-right: ${euiTheme.border.width.thin} solid transparent;

          ${isSelected
            ? `
              border-top-color: ${
                isLoading ? euiTheme.colors.borderBaseSubdued : euiTheme.colors.primary
              };
              border-left-color: ${euiTheme.colors.borderBaseSubdued};
              border-right-color: ${euiTheme.colors.borderBaseSubdued};
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
            `
            : ''}

          ${isDragging
            ? `
              ${euiSlightShadowHover(euiThemeContext)};
              border-radius: ${euiTheme.border.radius.small};
          `
            : ''}

          // right vertical separator
          &::before {
            content: '';
            position: absolute;
            right: -${euiTheme.size.xs};
            top: calc(
              50% - ${euiTheme.size.xs} / 2
            ); // 50% is the tab height midpoint, we want it centered in the middle of the whole tab bar
            transform: translateY(-50%);
            width: 1px;
            height: ${euiTheme.size.base};
            background-color: ${euiTheme.colors.borderBasePlain};
            transition: opacity ${euiTheme.animation.fast};
            opacity: ${hideRightSeparator || isDragging ? '0' : '1'};
            pointer-events: none;
          }
        `}
      >
        <div
          css={css`
            ${!isSelected
              ? `
              &:hover {
                background-color: ${euiTheme.colors.backgroundLightPrimary};
                color: ${euiTheme.colors.primary};
                border-radius: ${euiTheme.border.radius.small};
              }
            `
              : ''}
          `}
        >
          {children}
        </div>
        {isSelected && !isDragging && (
          <>
            <Accent direction="left" euiTheme={euiTheme} />
            <Accent direction="right" euiTheme={euiTheme} />
          </>
        )}
      </div>
    );
  }
);

/**
 * Draws the concave "flare" that joins the selected tab's side border to the tabs bar separator
 * line, using plain CSS instead of an inline SVG.
 *
 * The element is a square sitting just outside the tab's bottom corner, within the 4px tab margin
 * plus the 4px inline padding the scrollable tabs container reserves for it. Rounding the square's
 * corner that touches the tab turns the square's own shape into the transparent "hole" of the
 * curve. The spread-only `box-shadow` then paints the tab background everywhere else inside the
 * square (covering the separator line underneath), and a one-sided border traces the curve with
 * the same color as the tab's side borders. `clip-path` keeps the shadow from spilling outside the
 * square.
 */
const Accent = ({
  direction,
  euiTheme,
}: {
  direction: 'left' | 'right';
  euiTheme: EuiThemeComputed;
}) => {
  const size = euiTheme.size.s;
  // the side of the square that touches the tab
  const tabSide = direction === 'left' ? 'right' : 'left';

  return (
    <span
      aria-hidden="true"
      css={css`
        position: absolute;
        bottom: 0;
        ${direction}: -${size};
        width: ${size};
        height: ${size};
        pointer-events: none;
        border-bottom-${tabSide}-radius: ${size};
        border-bottom: ${euiTheme.border.width.thin} solid ${euiTheme.colors.borderBaseSubdued};
        border-${tabSide}: ${euiTheme.border.width.thin} solid ${euiTheme.colors.borderBaseSubdued};
        box-shadow: 0 0 0 ${size} ${euiTheme.colors.backgroundBasePlain};
        clip-path: inset(0);
      `}
    />
  );
};
