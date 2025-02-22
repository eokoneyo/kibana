/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiIconTip,
  EuiLoadingSpinner,
  EuiPortal,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { RuleNotifyWhen, parseRuleCircuitBreakerErrorMessage } from '@kbn/alerting-plugin/common';
import { IS_RULE_SPECIFIC_FLAPPING_ENABLED } from '@kbn/alerts-ui-shared/src/common/constants/rule_flapping';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { toMountPoint } from '@kbn/react-kibana-mount';
import { fetchUiConfig as triggersActionsUiConfig, updateRule } from '@kbn/response-ops-rule-form';
import { cloneDeep, omit } from 'lodash';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useKibana } from '../../../common/lib/kibana';
import {
  IErrorObject,
  Rule,
  RuleAction,
  RuleEditProps,
  RuleFlyoutCloseReason,
  RuleNotifyWhenType,
  RuleType,
  RuleTypeMetaData,
  RuleTypeParams,
  RuleUiAction,
  TriggersActionsUiConfig,
} from '../../../types';
import { HealthCheck } from '../../components/health_check';
import { ToastWithCircuitBreakerContent } from '../../components/toast_with_circuit_breaker_content';
import { HealthContextProvider } from '../../context/health_context';
import { loadRuleTypes } from '../../lib/rule_api/rule_types';
import { getRuleWithInvalidatedFields } from '../../lib/value_validators';
import { ConfirmRuleClose } from './confirm_rule_close';
import { hasRuleChanged } from './has_rule_changed';
import { getRuleActionErrors, getRuleErrors, isValidRule } from './rule_errors';
import { RuleForm } from './rule_form';
import { getRuleReducer } from './rule_reducer';
import { ShowRequestModal } from './show_request_modal';

const defaultUpdateRuleErrorMessage = i18n.translate(
  'xpack.triggersActionsUI.sections.ruleEdit.saveErrorNotificationText',
  {
    defaultMessage: 'Cannot update rule.',
  }
);

// Separate function for determining if an untyped action has a group property or not, which helps determine if
// it is a default action or a system action. Consolidated here to deal with type definition complexity
const actionHasDefinedGroup = (action: RuleUiAction): action is RuleAction => {
  if (!('group' in action)) return false;
  // If the group property is present, ensure that it isn't null or undefined
  return Boolean(action.group);
};

const cloneAndMigrateRule = (initialRule: Rule) => {
  const clonedRule = cloneDeep(omit(initialRule, 'notifyWhen', 'throttle'));

  const hasRuleLevelNotifyWhen = Boolean(initialRule.notifyWhen);
  const hasRuleLevelThrottle = Boolean(initialRule.throttle);

  if (hasRuleLevelNotifyWhen || hasRuleLevelThrottle) {
    const frequency = hasRuleLevelNotifyWhen
      ? {
          summary: false,
          notifyWhen: initialRule.notifyWhen as RuleNotifyWhenType,
          throttle:
            initialRule.notifyWhen === RuleNotifyWhen.THROTTLE ? initialRule.throttle! : null,
        }
      : { summary: false, notifyWhen: RuleNotifyWhen.THROTTLE, throttle: initialRule.throttle! };

    clonedRule.actions = clonedRule.actions.map((action: RuleUiAction) => {
      if (actionHasDefinedGroup(action)) {
        return {
          ...action,
          frequency,
        };
      }
      return action;
    });
  }
  return clonedRule;
};

export type RuleEditComponent = typeof RuleEdit;

export const RuleEdit = <
  Params extends RuleTypeParams = RuleTypeParams,
  MetaData extends RuleTypeMetaData = RuleTypeMetaData
>({
  initialRule,
  onClose,
  reloadRules,
  onSave,
  hideInterval,
  ruleTypeRegistry,
  actionTypeRegistry,
  metadata: initialMetadata,
  ...props
}: RuleEditProps<Params, MetaData>) => {
  const onSaveHandler = onSave ?? reloadRules;
  const ruleReducer = useMemo(() => getRuleReducer<Rule>(actionTypeRegistry), [actionTypeRegistry]);
  const [{ rule }, dispatch] = useReducer(ruleReducer, {
    rule: cloneAndMigrateRule(initialRule),
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasActionsDisabled, setHasActionsDisabled] = useState<boolean>(false);
  const [hasActionsWithBrokenConnector, setHasActionsWithBrokenConnector] =
    useState<boolean>(false);
  const [isConfirmRuleCloseModalOpen, setIsConfirmRuleCloseModalOpen] = useState<boolean>(false);
  const [isShowRequestModalOpen, setIsShowRequestModalOpen] = useState<boolean>(false);
  const [isRuleValid, setIsRuleValid] = useState<boolean>(false);
  const [ruleActionsErrors, setRuleActionsErrors] = useState<IErrorObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [serverRuleType, setServerRuleType] = useState<RuleType<string, string> | undefined>(
    props.ruleType
  );
  const [config, setConfig] = useState<TriggersActionsUiConfig>({ isUsingSecurity: false });

  const [metadata, setMetadata] = useState(initialMetadata);
  const onChangeMetaData = useCallback((newMetadata: any) => setMetadata(newMetadata), []);

  const {
    http,
    notifications: { toasts },
    isServerless,
    ...startServices
  } = useKibana().services;

  const setRule = (value: Rule) => {
    dispatch({ command: { type: 'setRule' }, payload: { key: 'rule', value } });
  };

  const ruleType = ruleTypeRegistry.get(rule.ruleTypeId);

  useEffect(() => {
    (async () => {
      setConfig(await triggersActionsUiConfig({ http }));
    })();
  }, [http]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const res = await getRuleActionErrors(rule.actions, actionTypeRegistry);
      setRuleActionsErrors([...res]);
      setIsLoading(false);
    })();
  }, [rule.actions, actionTypeRegistry]);

  useEffect(() => {
    if (!props.ruleType && !serverRuleType) {
      (async () => {
        const serverRuleTypes = await loadRuleTypes({ http });
        for (const _serverRuleType of serverRuleTypes) {
          if (ruleType.id === _serverRuleType.id) {
            setServerRuleType(_serverRuleType);
          }
        }
      })();
    }
  }, [props.ruleType, ruleType.id, serverRuleType, http]);

  const { ruleBaseErrors, ruleErrors, ruleParamsErrors } = getRuleErrors(
    rule as Rule,
    ruleType,
    config,
    actionTypeRegistry,
    isServerless
  );

  const checkForChangesAndCloseFlyout = () => {
    if (hasRuleChanged(rule, initialRule, true)) {
      setIsConfirmRuleCloseModalOpen(true);
    } else {
      onClose(RuleFlyoutCloseReason.CANCELED, metadata);
    }
  };

  async function onSaveRule(): Promise<void> {
    setIsSaving(true);
    try {
      if (
        !isLoading &&
        isValidRule(rule, ruleErrors, ruleActionsErrors) &&
        !hasActionsWithBrokenConnector
      ) {
        const { flapping, ...restRule } = rule;
        const newRule = await updateRule({
          http,
          rule: {
            ...restRule,
            ...(IS_RULE_SPECIFIC_FLAPPING_ENABLED ? { flapping } : {}),
          },
          id: rule.id,
        });
        toasts.addSuccess(
          i18n.translate('xpack.triggersActionsUI.sections.ruleEdit.saveSuccessNotificationText', {
            defaultMessage: "Updated ''{ruleName}''",
            values: {
              ruleName: newRule.name,
            },
          })
        );
        onClose(RuleFlyoutCloseReason.SAVED, metadata);
        if (onSaveHandler) {
          onSaveHandler(metadata);
        }
      } else {
        setRule(
          getRuleWithInvalidatedFields(rule, ruleParamsErrors, ruleBaseErrors, ruleActionsErrors)
        );
      }
    } catch (errorRes) {
      const message = parseRuleCircuitBreakerErrorMessage(
        errorRes.body?.message || defaultUpdateRuleErrorMessage
      );
      toasts.addDanger({
        title: message.summary,
        ...(message.details && {
          text: toMountPoint(
            <ToastWithCircuitBreakerContent>{message.details}</ToastWithCircuitBreakerContent>,
            startServices
          ),
        }),
      });
    }
    setIsSaving(false);
  }

  useEffect(() => {
    setIsRuleValid(isValidRule(rule, ruleErrors, ruleActionsErrors));
  }, [rule, ruleErrors, ruleActionsErrors]);

  return (
    <EuiPortal>
      <EuiFlyout
        onClose={checkForChangesAndCloseFlyout}
        aria-labelledby="flyoutRuleEditTitle"
        size="m"
        maxWidth={620}
        ownFocus
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="s" data-test-subj="editRuleFlyoutTitle">
            <h3 id="flyoutTitle">
              <FormattedMessage
                defaultMessage="Edit rule"
                id="xpack.triggersActionsUI.sections.ruleEdit.flyoutTitle"
              />
            </h3>
          </EuiTitle>
        </EuiFlyoutHeader>
        <HealthContextProvider>
          <HealthCheck inFlyout={true} waitForCheck={true}>
            <EuiFlyoutBody>
              {hasActionsDisabled && (
                <>
                  <EuiCallOut
                    size="s"
                    color="danger"
                    iconType="error"
                    data-test-subj="hasActionsDisabled"
                    title={i18n.translate(
                      'xpack.triggersActionsUI.sections.ruleEdit.disabledActionsWarningTitle',
                      { defaultMessage: 'This rule has actions that are disabled' }
                    )}
                  />
                  <EuiSpacer />
                </>
              )}
              <RuleForm
                rule={rule}
                config={config}
                dispatch={dispatch}
                errors={ruleErrors}
                actionTypeRegistry={actionTypeRegistry}
                hideInterval={hideInterval}
                ruleTypeRegistry={ruleTypeRegistry}
                canChangeTrigger={false}
                setHasActionsDisabled={setHasActionsDisabled}
                setHasActionsWithBrokenConnector={setHasActionsWithBrokenConnector}
                operation={i18n.translate(
                  'xpack.triggersActionsUI.sections.ruleEdit.operationName',
                  {
                    defaultMessage: 'edit',
                  }
                )}
                metadata={metadata}
                onChangeMetaData={onChangeMetaData}
              />
            </EuiFlyoutBody>
            <EuiFlyoutFooter>
              <EuiFlexGroup justifyContent="spaceBetween">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    data-test-subj="cancelSaveEditedRuleButton"
                    onClick={() => checkForChangesAndCloseFlyout()}
                  >
                    {i18n.translate('xpack.triggersActionsUI.sections.ruleEdit.cancelButtonLabel', {
                      defaultMessage: 'Cancel',
                    })}
                  </EuiButtonEmpty>
                </EuiFlexItem>
                {isLoading ? (
                  <EuiFlexItem grow={false}>
                    <EuiSpacer size="s" />
                    <EuiLoadingSpinner size="l" />
                  </EuiFlexItem>
                ) : (
                  <></>
                )}
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup alignItems="center" gutterSize="m">
                    <EuiFlexItem grow={false}>
                      <EuiButton
                        fill
                        color="primary"
                        data-test-subj="showEditedRequestButton"
                        isDisabled={!isRuleValid}
                        onClick={() => {
                          setIsShowRequestModalOpen(true);
                        }}
                      >
                        <FormattedMessage
                          id="xpack.triggersActionsUI.sections.ruleEdit.showRequestButtonLabel"
                          defaultMessage="Show API request"
                        />
                      </EuiButton>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButton
                        fill
                        color="primary"
                        data-test-subj="saveEditedRuleButton"
                        type="submit"
                        iconType="check"
                        isLoading={isSaving}
                        onClick={async () => await onSaveRule()}
                      >
                        <FormattedMessage
                          id="xpack.triggersActionsUI.sections.ruleEdit.saveButtonLabel"
                          defaultMessage="Save"
                        />
                      </EuiButton>
                    </EuiFlexItem>
                    {config.isUsingSecurity && (
                      <EuiFlexItem grow={false}>
                        <EuiIconTip
                          type="warning"
                          position="top"
                          data-test-subj="changeInPrivilegesTip"
                          content={i18n.translate(
                            'xpack.triggersActionsUI.sections.ruleEdit.changeInPrivilegesLabel',
                            {
                              defaultMessage:
                                'Saving this rule will change its privileges and might change its behavior.',
                            }
                          )}
                        />
                      </EuiFlexItem>
                    )}
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlyoutFooter>
          </HealthCheck>
        </HealthContextProvider>
        {isConfirmRuleCloseModalOpen && (
          <ConfirmRuleClose
            onConfirm={() => {
              setIsConfirmRuleCloseModalOpen(false);
              onClose(RuleFlyoutCloseReason.CANCELED, metadata);
            }}
            onCancel={() => {
              setIsConfirmRuleCloseModalOpen(false);
            }}
          />
        )}
        {isShowRequestModalOpen && (
          <ShowRequestModal
            onClose={() => {
              setIsShowRequestModalOpen(false);
            }}
            rule={rule}
            ruleId={rule.id}
            edit={true}
          />
        )}
      </EuiFlyout>
    </EuiPortal>
  );
};

// eslint-disable-next-line import/no-default-export
export { RuleEdit as default };
