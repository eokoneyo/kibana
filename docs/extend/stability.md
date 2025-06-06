---
mapped_pages:
  - https://www.elastic.co/guide/en/kibana/current/stability.html
---

# Stability [stability]

Ensure your feature will work under all possible {{kib}} scenarios.


## Environmental configuration scenarios [_environmental_configuration_scenarios]

* Cloud

    * Does the feature work on **cloud environment**?
    * Does it create a setting that needs to be exposed, or configured differently than the default, on Cloud? (whitelisting of certain settings/users? Ref: [docs-content://deploy-manage/deploy/elastic-cloud/edit-stack-settings.md](docs-content://deploy-manage/deploy/elastic-cloud/edit-stack-settings.md) , [/reference/cloud/elastic-cloud-kibana-settings.md](/reference/cloud/elastic-cloud-kibana-settings.md))
    * Is there a significant performance impact that may affect Cloud {{kib}} instances?
    * Does it need to be aware of running in a container? (for example monitoring)

* Multiple {{kib}} instances

    * Pointing to the same index
    * Pointing to different indexes

        * Should make sure that the {{kib}} index is not hardcoded anywhere.
        * Should not be storing a bunch of stuff in {{kib}} memory.
        * Should emulate a high availability deployment.
        * Anticipating different timing related issues due to shared resource access.
        * We need to make sure security is set up in a specific way for non-standard {{kib}} indices. (create their own custom roles)

* {{kib}} running behind a reverse proxy or load balancer, without sticky sessions.
* If a proxy/loadbalancer is running between ES and {{kib}}


## Kibana.yml settings [_kibana_yml_settings]

* Using a custom {{kib}} index alias
* When optional dependencies are disabled

    * Ensure all your required dependencies are listed in kibana.json dependency list!



## Test coverage [_test_coverage]

Testing UI code is hard. We strive for [total automated test coverage](https://github.com/elastic/engineering/blob/master/kibana_dev_principles.md#automate-tests-through-ci) of our code and UX, but this is difficult to measure and we’re constrained by time. During development, test coverage measurement is subjective and manual, based on our understanding of the feature. Code coverage reports indicate possible gaps, but it ultimately comes down to a judgment call. Here are some guidelines to help you ensure sufficient automated test coverage.

* Every PR should be accompanied by tests.
* Check the before and after automated test coverage metrics. If coverage has gone down you might have missed some tests.
* Cover failure cases, edge cases, and happy paths with your tests.
* Pay special attention to code that could contain bugs that harm to the user. "Harm" includes direct problems like data loss and data entering a bad state, as well as indirect problems like making a poor business decision based on misinformation presented by the UI. For example, state migrations and security permissions are important areas to cover.
* Pay special attention to public APIs, which may be used in unexpected ways. Any code you release for consumption by other plugins should be rigorously tested with many permutations.
* Include end-to-end tests for areas where the logic spans global state, URLs, and multiple plugin APIs.
* Every time a bug is reported, add a test to cover it.
* Retrospectively gauge the quality of the code you ship by tracking how many bugs are reported for features that are released. How can you reduce this number by improving your testing approach?


## Browser coverage [_browser_coverage]

Refer to the list of browsers and OS {{kib}} supports: [https://www.elastic.co/support/matrix](https://www.elastic.co/support/matrix)

Does the feature work efficiently on the list of supported browsers?


## Upgrade and Migration scenarios [_upgrade_and_migration_scenarios]

* Does the feature affect old indices or saved objects?
* Has the feature been tested with {{kib}} aliases?
* Read/Write privileges of the indices before and after the upgrade?

