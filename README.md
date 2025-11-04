# Voluntary Leaver Tool

Voluntary Leaver Tool (VLT) is part of Kliemt Transformation Suite (KTS). It is a project based on Vue.

## Installation

All standard Vue practices apply, so refer to docs for the current version of Vue that is used. Generally on a bare bones machine you should:

Install Node/NPM and set up project with:

```sh
npm install
```

## Prerequisites

Local development relies on [kliemt-api](https://github.com/droxic/kliemt-api/) to be set up and runnig.

## Compile and Hot-Reload for Development

```sh
npm run dev
```

## Deploying

For deploying to staging or production you should refer and use the supplied `deploy.sh` script. 

Prerequisites are that you have docker and kubectl set up with appropriate access to targeted cluster.

Additionally you should have [Azure cli](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) set up and you need to be logged to the kliemt container registry set up on Azure, achieved via:

    az acr login --name kliemt
