import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ec2 from "aws-cdk-lib/aws-ec2"

interface Props {
  vpc: ec2.Vpc
}

export class EcsCluster extends Construct {
  cluster: ecs.Cluster
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    const ecsCluster = new ecs.Cluster(this, `BackendCluster`, {
      vpc: props.vpc,
    })

    new cdk.CfnOutput(this, `BackendClusterArn`, {
      value: ecsCluster.clusterArn,
    })

    this.cluster = ecsCluster
  }
}
