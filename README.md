# Hub Deployment Associator

[![test-action](https://github.com/shipatlas/hub-deployment-associator/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/shipatlas/hub-deployment-associator/actions/workflows/test.yml)

GitHub Action that associates a workflow run with a ShipAtlas Hub deployment.

## Motivation

When a deployment is created on Hub, it creates a [GitHub deployment][github-deployments] which then dispatches a [`deployment` event][github-deployment-event]. Hub then relies on workflows configured to trigger workflow runs `on: deployment`. The progress of the created workflow runs (from the `deployment` trigger) are tracked by listening their [`workflow_run` events][github-workflow-run-event]. Unfortunately the [`deployment` event][github-deployment-event] doesn't provide any way to identify the workflow run running the deployment so that Hub can programmatically track it.

Which is where this action comes in. It takes advantage of the fact that the workflow run has access to the [`deployment` event][github-deployment-event] that triggered it in [`github` context][github-context]. With the information therein, it's possible to communicate back to Hub which of its deployments is responsible for the workflow run.

## Usage

Set up the deploy job to have the association job as a pre-requisite as shown below:

```yaml
name: deploy-application

on:
  - deployment

jobs:
  associate:
    runs-on: ubuntu-latest
    steps:
      - name: Associate Deployment
        uses: shipatlas/hub-deployment-associator@v1
  deploy:
    runs-on: ubuntu-latest
    needs: associate
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      # [... continuation of deployment process ...]
```

If the association succeeds, the deploy will proceed. And if it fails, the deploy won't run.

[github-deployments]: https://docs.github.com/en/rest/deployments/deployments?apiVersion=2022-11-28
[github-context]: https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
[github-deployment-event]: https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#deployment
[github-deployment-status-event]: https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#deployment_status
[github-workflow-run-event]: https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_run
