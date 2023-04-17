import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager"
import { EnvironmentType } from "./envs"
import { lookupDefaultRoute53Zone } from "../common/lookup"

export interface StackProps extends cdk.StackProps {
  environment: EnvironmentType
}

export abstract class StackBase extends cdk.Stack {
  readonly zone: route53.IHostedZone
  readonly gitlabSecret: secretsManager.ISecret

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    this.zone = lookupDefaultRoute53Zone(this, props.environment)

    cdk.Tags.of(this).add("Environment", props.environment.name)
  }
}
