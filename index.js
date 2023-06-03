const axios = require('axios');
const core = require('@actions/core');
const github = require('@actions/github');

// Action Input Parameters
const baseUrlOverride = core.getInput('base-url');

// GitHub Context Parameters
const context = github.context;
const deploymentUid = context.event.deployment.id;
const httpToken = context.event.deployment.payload.dispatch_token;
const workflowRunUid = context.run_id;

// Register secrets with the runner to ensure they are masked in logs.
core.setSecret(httpToken);

// Prepare URL for the request.
let baseUrl = 'https://api-reference.shipatlas.dev';
if (baseUrlOverride) {
  baseUrl = baseUrlOverride;
}
const url = `${baseUrl}/callbacks/github/workflow_runs/${workflowRunUid}/associate/${deploymentUid}`;

// Prepare headers for the request.
const headers = {
  Accept: 'application/json',
  Authorization: `Bearer ${httpToken}`,
  'Content-Type': 'application/json',
};

axios.post(url, null, { headers })
  .then((response) => {
    const statusCode = response.status;
    const { statusText } = response;

    if (statusCode === 200) {
      core.info(`[${statusText}] Deployment association request was successful`);
    } else {
      core.setFailed(`[${statusText}] Unexpected status code: ${statusCode}`);
    }
  })
  .catch((error) => {
    core.error('[Error] Unsuccessful deployment association request');

    let errorMessage = '';

    if (error.response) {
      const statusCode = error.response.status;
      const { statusText } = error.response;

      errorMessage += `[${statusText}]`;

      if (statusCode === 404) {
        // When the referenced resources are not found on the server
        errorMessage += "Either deployment or workflow run wasn't found";
      } else if (statusCode === 401) {
        if (error.response.data.code === 'authentication' && error.response.data.title) {
          // When response has more context around the error then we can pass
          // that along to the user.
          errorMessage += `${error.response.data.title}`;
        } else {
          // When the response doesn't have more context, then we can use a
          // generic message.
          errorMessage += 'Invalid authentication credentials';
        }
      } else {
        errorMessage += 'Unexpected status code';
      }

      core.debug(error.response.data);
      core.debug(error.response.status);
      core.debug(error.response.headers);
    } else if (error.request) {
      errorMessage = '[Error] The request was made but no response was received';
      core.debug(error.request);
    } else {
      errorMessage = '[Error] Something happened in setting up the request that triggered an error';
      core.debug(error.toJSON());
    }

    core.setFailed(errorMessage);
  });