/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { RULE_SAVED_OBJECT_TYPE } from '@kbn/alerting-plugin/server';
import { Spaces } from '../../../scenarios';
import type { FtrProviderContext } from '../../../../common/ftr_provider_context';
import {
  AlertUtils,
  checkAAD,
  getUrlPrefix,
  getTestRuleData,
  ObjectRemover,
} from '../../../../common/lib';

/**
 * Eventhough security is disabled, this test checks the API behavior.
 */

export default function createUpdateApiKeyTests({ getService }: FtrProviderContext) {
  const supertestWithoutAuth = getService('supertestWithoutAuth');

  describe('update_api_key', () => {
    const objectRemover = new ObjectRemover(supertestWithoutAuth);
    const alertUtils = new AlertUtils({ space: Spaces.space1, supertestWithoutAuth });

    after(() => objectRemover.removeAll());

    describe('handle update alert api key appropriately', function () {
      this.tags('skipFIPS');
      it('should handle update alert api key appropriately', async () => {
        const { body: createdAlert } = await supertestWithoutAuth
          .post(`${getUrlPrefix(Spaces.space1.id)}/api/alerting/rule`)
          .set('kbn-xsrf', 'foo')
          .send(getTestRuleData())
          .expect(200);
        objectRemover.add(Spaces.space1.id, createdAlert.id, 'rule', 'alerting');

        await alertUtils.updateApiKey(createdAlert.id);

        const { body: updatedAlert } = await supertestWithoutAuth
          .get(`${getUrlPrefix(Spaces.space1.id)}/api/alerting/rule/${createdAlert.id}`)
          .set('kbn-xsrf', 'foo')
          .expect(200);
        expect(updatedAlert.api_key_owner).to.eql(null);

        // Ensure revision is not incremented when API key is updated
        expect(updatedAlert.revision).to.eql(0);

        // Ensure AAD isn't broken
        await checkAAD({
          supertest: supertestWithoutAuth,
          spaceId: Spaces.space1.id,
          type: RULE_SAVED_OBJECT_TYPE,
          id: createdAlert.id,
        });
      });
    });

    describe("shouldn't update alert api key", function () {
      this.tags('skipFIPS');
      it(`shouldn't update alert api key from another space`, async () => {
        const { body: createdAlert } = await supertestWithoutAuth
          .post(`${getUrlPrefix(Spaces.other.id)}/api/alerting/rule`)
          .set('kbn-xsrf', 'foo')
          .send(getTestRuleData())
          .expect(200);
        objectRemover.add(Spaces.other.id, createdAlert.id, 'rule', 'alerting');

        await alertUtils.getUpdateApiKeyRequest(createdAlert.id).expect(404, {
          statusCode: 404,
          error: 'Not Found',
          message: `Saved object [alert/${createdAlert.id}] not found`,
        });
      });
    });
  });
}
