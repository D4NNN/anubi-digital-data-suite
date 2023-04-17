import { Construct } from "constructs"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as route53 from "aws-cdk-lib/aws-route53"
import { BackendRole, BackendWebTask } from "./backend-task"
import { EnvironmentType } from "../../envs"
import { PostgresDatabase } from "../db/postgres"
import { buildDns } from "../../../common/resourceNames"
import { BackendBuckets } from "./buckets"
import { BackendQueues } from "./queues"
import { FargateTaskDefinitionProps } from "aws-cdk-lib/aws-ecs"

interface Props {
  commitHash: string
  cluster: ecs.Cluster
  environment: EnvironmentType
  zone: route53.IHostedZone
  taskDefinitionProps: FargateTaskDefinitionProps
  coreDatabase: PostgresDatabase
  buckets: BackendBuckets
  queues: BackendQueues
  role: BackendRole
  subdomain: string
  minInstances?: number
  maxInstances?: number
}

export class BackendService extends Construct {
  apiEndpoint: string

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id)

    const apiBackendDns = buildDns(props.subdomain, props.environment)

    new BackendWebTask(this, `BackendTask`, {
      cluster: props.cluster,
      taskDefinitionProps: props.taskDefinitionProps,
      commitHash: props.commitHash,
      environment: props.environment,
      zone: props.zone,
      coreDatabaseUrl: props.coreDatabase.connectionString,
      publicDomain: apiBackendDns,
      autoscalingEnabled: false,
      minInstances: props.minInstances,
      maxInstances: props.maxInstances,
      buckets: props.buckets,
      queues: props.queues,
      role: props.role,
    })

    this.apiEndpoint = `https://${apiBackendDns}`
  }
}
