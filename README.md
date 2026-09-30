# Job Radar

Job Radar is part of Kliemt Transformation Suite (KTS). It is a Vue-based frontend for project-scoped Job Radar workflows in `kliemt-api`.

## Current workflow

- Navigate through assigned projects.
- Select an employee in a project.
- Run prompts and persist each run.
- Review run history and open detailed run results.
- Add/remove curated matches that remain persistent across prompt runs.

The legacy `/playground` route remains as a compatibility redirect to project-based flow.

## Installation

All standard Vue practices apply. On a fresh machine:

Install Node/NPM and set up project with:

```sh
yarn install
```

## Prerequisites

Local development relies on `kliemt-api` being set up and running.

## Compile and Hot-Reload for Development

```sh
yarn dev
```

## Deploying

For deploying to staging or production, use the supplied `deploy.sh` script.

Prerequisites are that you have docker and kubectl set up with appropriate access to targeted cluster.

Additionally you should have [Azure cli](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) set up and you need to be logged to the kliemt container registry set up on Azure, achieved via:

    az acr login --name kliemt
