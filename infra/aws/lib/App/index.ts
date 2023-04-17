import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Construct } from "constructs"
import { StackBase } from "../common"
import { AppParams, EnvironmentType } from "../envs"
import { Backend } from "./backend"
import { EcsCluster } from "./cluster"

export interface AppProps extends cdk.StackProps {
  environment: EnvironmentType
  settings: AppParams
}

export class AppStack extends StackBase {
  constructor(scope: Construct, id: string, props: AppProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(
      this,
      `VPC`,
      props.environment.config.infrastructure.vpc
    )

    const ecsCluster = new EcsCluster(this, "EcsCluster", {
      vpc,
    })

    const commitHash = new cdk.CfnParameter(this, "commitHash")
    new Backend(this, "Backend", {
      vpc,
      environment: props.environment,
      zone: this.zone,
      commitHash: commitHash.valueAsString,
      ecsCluster,
    })
  }
}
