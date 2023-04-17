import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as iam from "aws-cdk-lib/aws-iam"
import { FargateTaskDefinitionProps } from "aws-cdk-lib/aws-ecs"
import * as route53 from "aws-cdk-lib/aws-route53"
import { Construct } from "constructs"
import { EnvironmentType } from "../../envs"
import { BatchEnvironment } from "../batch/cluster"
import { EcsCluster } from "../cluster"
import { PostgresDatabase } from "../db/postgres"
import { Lambda } from "../lambda"
import { BackendService } from "./backend-service"
import { BatchJobsConstruct } from "./batch-jobs"
import { BackendBuckets } from "./buckets"
import { BackendQueues } from "./queues"

export interface BackendProps {
  commitHash: string
  environment: EnvironmentType
  zone: route53.IHostedZone
  vpc: ec2.Vpc
  ecsCluster: EcsCluster
}

type BackendTaskProps =
  BackendProps["environment"]["config"]["infrastructure"]["backend"]["services"]["jobs"]["task"]

const createTaskDefinitionProps = (
  props: BackendTaskProps,
  role: iam.IRole
): FargateTaskDefinitionProps => {
  return {
    cpu: props.cpu,
    memoryLimitMiB: props.memoryLimitMiB,
    taskRole: role,
  }
}

export class Backend extends Construct {
  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id)

    const coreDatabase = new PostgresDatabase(this, "CoreDatabase", {
      vpc: props.vpc,
      env: props.environment,
      settings: props.environment.config.infrastructure.postgres.core,
    })

    const queues = new BackendQueues(this, "BackendQueues", {
      env: props.environment,
    })

    const buckets = new BackendBuckets(this, "BackendBuckets", {
      env: props.environment,
    })

    const backendRole = iam.Role.fromRoleName(
      this,
      "BackendRole",
      props.environment.config.infrastructure.backend.taskRole
    )

    new BackendService(this, "BackendJobs", {
      cluster: props.ecsCluster.cluster,
      commitHash: props.commitHash,
      zone: props.zone,
      environment: props.environment,
      buckets,
      queues,
      coreDatabase,
      role: "jobs",
      subdomain: props.environment.config.infrastructure.backend.jobsSubdomain,
      taskDefinitionProps: createTaskDefinitionProps(
        props.environment.config.infrastructure.backend.services.jobs.task,
        backendRole
      ),
      minInstances:
        props.environment.config.infrastructure.backend.services.jobs
          .minInstances,
      maxInstances:
        props.environment.config.infrastructure.backend.services.jobs
          .maxInstances,
    })

    new BackendService(this, "BackendApi", {
      cluster: props.ecsCluster.cluster,
      commitHash: props.commitHash,
      zone: props.zone,
      environment: props.environment,
      buckets,
      queues,
      coreDatabase,
      role: "api",
      subdomain: props.environment.config.infrastructure.backend.apiSubdomain,
      taskDefinitionProps: createTaskDefinitionProps(
        props.environment.config.infrastructure.backend.services.api.task,
        backendRole
      ),
      minInstances:
        props.environment.config.infrastructure.backend.services.api
          .minInstances,
      maxInstances:
        props.environment.config.infrastructure.backend.services.api
          .maxInstances,
    })

    const batchEnvironment = new BatchEnvironment(this, "Batch", {
      vpc: props.vpc,
      environment: props.environment,
    })

    const batches = new BatchJobsConstruct(this, "Jobs", {
      computeEnvironment: batchEnvironment.computeEnvironment,
      jobsQueue: batchEnvironment.jobsQueue,
      commitHash: props.commitHash,
      environment: props.environment,
      coreDatabase,
      buckets,
    })

    new Lambda(this, "Lambda", {
      vpc: props.vpc,
      commitHash: props.commitHash,
      environment: props.environment,
      zone: props.zone,
      coreDatabase,
      buckets,
      batches,
    })
  }
}
