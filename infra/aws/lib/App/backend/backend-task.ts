import { Construct } from "constructs"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2"
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as cdk from "aws-cdk-lib"
import { EnvironmentType } from "../../envs"
import { FargateTaskDefinitionProps } from "aws-cdk-lib/aws-ecs"
import { BackendContainer } from "./backend-container"
import { BackendBuckets } from "./buckets"
import { BackendQueues } from "./queues"

export type BackendRole = "api" | "jobs"

export interface BackendTaskProps {
  commitHash: string
  cluster: ecs.Cluster
  environment: EnvironmentType
  zone: route53.IHostedZone
  publicDomain: string
  coreDatabaseUrl: string
  taskDefinitionProps: FargateTaskDefinitionProps
  autoscalingEnabled: boolean
  minInstances?: number
  maxInstances?: number
  buckets: BackendBuckets
  queues: BackendQueues
  role: BackendRole
}

export class BackendWebTask extends Construct {
  constructor(scope: Construct, id: string, props: BackendTaskProps) {
    super(scope, id)

    const task = new ecs.FargateTaskDefinition(
      this,
      `BackendPublicTaskDef`,
      props.taskDefinitionProps
    )

    new cdk.CfnOutput(this, `BackendPublicTaskDefArn`, {
      value: task.taskDefinitionArn,
    })

    new BackendContainer(this, `BackendNode`, {
      task,
      commitHash: props.commitHash,
      environment: props.environment,
      command: [
        "yarn",
        `backend:serve:${props.environment.name}:${props.role}`,
      ],
      portMappings: [
        {
          hostPort: 443,
          containerPort: 443,
          protocol: ecs.Protocol.TCP,
        },
      ],
      coreDatabaseUrl: props.coreDatabaseUrl,
      buckets: props.buckets,
      queues: props.queues,
      role: props.role,
    })

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "BackendPublic",
      {
        cluster: props.cluster,
        taskDefinition: task,
        domainName: props.publicDomain,
        domainZone: props.zone,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        redirectHTTP: true,
        assignPublicIp: true,
        desiredCount:
          !props.autoscalingEnabled && props.minInstances
            ? props.minInstances
            : 1,
      }
    )

    service.targetGroup.configureHealthCheck({
      enabled: true,
      interval: cdk.Duration.seconds(15),
      path: "/health/",
      timeout: cdk.Duration.seconds(10),
      unhealthyThresholdCount: 8,
      healthyThresholdCount: 2,
    })

    service.targetGroup.setAttribute(
      "deregistration_delay.timeout_seconds",
      "5"
    )

    if (props.autoscalingEnabled) {
      const scalableTarget = service.service.autoScaleTaskCount({
        minCapacity: props.minInstances ?? 1,
        maxCapacity: props.maxInstances ?? 4,
      })

      scalableTarget.scaleOnMemoryUtilization("ScaleUpMem", {
        targetUtilizationPercent: 75,
      })

      scalableTarget.scaleOnCpuUtilization("ScaleUpCPU", {
        targetUtilizationPercent: 75,
      })
    }
  }
}
