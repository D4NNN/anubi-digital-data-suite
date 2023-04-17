#!/usr/bin/env node
import * as dotenv from "dotenv"
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { appParams, Environment } from "../lib/envs"
import { AppStack } from "../lib/App"

dotenv.config()

const environments = [
  Environment.Production,
  Environment.Staging,
  Environment.Test,
]

const app = new cdk.App()

environments.forEach((environment) => {
  const commonStackProps = {
    environment,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }

  // staticSites.map(
  //   (site) =>
  //     new StaticSiteStack(app, `anubi-${environment.id}-site-${site.id}`, {
  //       settings: site,
  //       ...commonStackProps,
  //     })
  // )

  new AppStack(app, `anubi-public-${environment.id}-app`, {
    ...commonStackProps,
    settings: appParams,
  })
})
