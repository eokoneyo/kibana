/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { UserAtSpaceScenarios } from '../../../scenarios';
import { getUrlPrefix } from '../../../../common/lib/space_test_utils';
import type { FtrProviderContext } from '../../../../common/ftr_provider_context';

export default function listActionTypesTests({ getService }: FtrProviderContext) {
  const supertestWithoutAuth = getService('supertestWithoutAuth');

  describe('connector_types', () => {
    for (const scenario of UserAtSpaceScenarios) {
      const { user, space } = scenario;
      describe(scenario.id, () => {
        it('should return 200 with list of action types containing defaults', async () => {
          const response = await supertestWithoutAuth
            .get(`${getUrlPrefix(space.id)}/api/actions/connector_types`)
            .auth(user.username, user.password);

          function createActionTypeMatcher(id: string, name: string) {
            return (actionType: { id: string; name: string }) => {
              return actionType.id === id && actionType.name === name;
            };
          }

          expect(response.statusCode).to.eql(200);
          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all_alerts_none_actions at space1':
            case 'space_1_all at space2':
            case 'global_read at space1':
            case 'superuser at space1':
            case 'space_1_all at space1':
            case 'space_1_all_with_restricted_fixture at space1':
              expect(response.statusCode).to.eql(200);
              // Check for values explicitly in order to avoid this test failing each time plugins register
              // a new action type
              expect(
                response.body.some(
                  createActionTypeMatcher('test.index-record', 'Test: Index Record')
                )
              ).to.be(true);
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });
      });
    }
  });
}
