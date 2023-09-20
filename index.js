const axios = require('axios');
const core = require('@actions/core');
const github = require('@actions/github');

// Action Input Parameters
const baseUrlOverride = core.getInput('base-url');
const callbackPathOverride = core.getInput('callback-path');

// GitHub Context Parameters
const { deployment } = github.context.payload;
const deploymentUID = deployment.id;
const httpToken = deployment.payload.dispatch_token;
const workflowRunUID = github.context.runId;

// Register secrets with the runner to ensure they are masked in logs.
core.setSecret(httpToken);

// Prepare URL for the request.
let baseUrl = 'https://hub.shipatlas.dev';
if (baseUrlOverride) {
  baseUrl = baseUrlOverride;
}

let callbackPath = '';
if (callbackPathOverride) {
  callbackPath = callbackPathOverride;
}

const url = `${baseUrl}${callbackPath}`;

// Prepare payload for the request.
const payload = {
  deployment_uid: deploymentUID,
  workflow_run_uid: workflowRunUID,
};

// Prepare headers for the request.
const headers = {
  Accept: 'application/vnd.api+json',
  Authorization: `Bearer ${httpToken}`,
  'Content-Type': 'application/vnd.api+json',
};

axios.post(url, payload, { headers })
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
