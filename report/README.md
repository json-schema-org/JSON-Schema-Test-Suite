# Test Suite Runner

This folder contains scripts and docker definitions that can run the suite against an implementation.  The implementations are configured in _implementations.json_.

## Add your implementation

Setting up your application requires several steps.

### Create a CLI

To add your implementation, you'll need to start by creating a CLI application that takes the following parameters:

- `--schema <PATH#POINTER>` - The relative URI to the schema, e.g. `../tests/draft2019-09/additionalItems.json#/0/schema`.
- `--instance <PATH#POINTER>` - The relative URI to the data instance, e.g. `../tests/draft2019-09/additionalItems.json#/0/tests/0/data`.
- `--spec-version <VERSION>` - The draft/version for the schema, e.g. `draft2020-12`.  The value for this parameter will match a folder name under `/tests/` in this repo.
<!-- Do we need this parameter? -->
<!-- - `--validate-formats` - Indicates whether to validate formats. -->

Internally, you may invoke your implementation as you see fit, setting any options you need to produce the correct outcome.

Validation outcome is indicated by the CLI exit code as follows:

- **-1** or **255** - The instance was determined to be invalid against the schema.
- **0** - The instance was determined to be valid against the schema.
- **1** - An application error occurred preventing the schema or instance from being processed.
- **2** - The scenario is not supported.

Each of these will be represented in the final report.

### Package your CLI

The CLI will need to be packaged into a Linux Docker image.

At a minimum this docker image will need your CLI as well as any runtime needed.

You'll need to push this to a public repository such as Docker Hub so that it can be pulled when the test suite runs.

### Update this repository

Lastly, update a file in this repo.

_implementations.json_ (in this folder) needs an entry that includes the following:

- `docker-image` - The name of your docker image.  The `latest` tag will be used.
- `command` - The command to run your CLI.
- `versions` - An array of versions/drafts supported by your implementations.  (To save time, unsupported versions will be skipped.)

Once added, the runner will do the rest.

