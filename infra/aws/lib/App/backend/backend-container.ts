import { Construct } from "constructs"
import * as cdk from "aws-cdk-lib"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ecr from "aws-cdk-lib/aws-ecr"
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager"
import { EnvironmentType } from "../../envs"
import { BackendBuckets } from "./buckets"
import { BackendQueues } from "./queues"

export type BackendRole = "jobs" | "api"

export interface ServiceProps {
  commitHash: string
  task: ecs.Ec2TaskDefinition
  command: string[]
  environment: EnvironmentType
  memoryReservationMiB?: number
  portMappings?: ecs.PortMapping[]
  coreDatabaseUrl: string
  buckets: BackendBuckets
  queues: BackendQueues
  role: BackendRole
}

export class BackendContainer extends Construct {
  constructor(scope: Construct, id: string, props: ServiceProps) {
    super(scope, id)

    // const dbFieldEncryptionKey = secretsManager.Secret.fromSecretNameV2(
    //   this,
    //   "DbFieldEncryptionKey",
    //   props.environment.config.infrastructure.backend.encryption
    //     .dbFieldEncryptionKey
    // )

    // const dbFieldEncryptionIV = secretsManager.Secret.fromSecretNameV2(
    //   this,
    //   "DbFieldEncryptionIV",
    //   props.environment.config.infrastructure.backend.encryption
    //     .dbFieldEncryptionIV
    // )

    const container = new ecs.ContainerDefinition(this, `${id}-ContainerDef`, {
      image: ecs.ContainerImage.fromEcrRepository(
        ecr.Repository.fromRepositoryName(
          this,
          `anubi-digital-repo`,
          "anubi-digital/backend-pb"
        ),
        `${props.environment.dockerEnvTag}-${props.commitHash}`
      ),
      memoryReservationMiB: props.memoryReservationMiB,
      command: props.command,
      environment: {
        HTTP_PORT: "443",
        DB_CORE_URL: props.coreDatabaseUrl,
        // DB_FIELD_ENCRYPTION_KEY: dbFieldEncryptionKey
        //   .secretValueFromJson("value")
        //   .toString(),
        // DB_FIELD_ENCRYPTION_IV: dbFieldEncryptionIV
        //   .secretValueFromJson("value")
        //   .toString(),
        ONBOARDING_BUCKET: props.buckets.onboardingDataBucket.bucketName,
        ONBOARDING_TOKEN_EXPIRATION_DAYS:
          props.environment.config.backend.buckets.onboardingDataTokenExpirationDays.toString(),
        QUEUE_OPERATION_DEFAULT_TIMEOUT_MS:
          props.environment.config.backend.queues.queueOperationDefaultTimeoutMs.toString(),
        QUEUE_OPERATION_DEFAULT_POLLING_MS:
          props.environment.config.backend.queues.queueOperationDefaultPollingMs.toString(),
        BACKEND_CORE_INBOUND_QUEUE_URL: props.queues.inboundEventQueue.queueUrl,
        BACKEND_CORE_OUTBOUND_QUEUE_URL:
          props.queues.outboundEventQueue.queueUrl,
        BACKEND_CORE_DATA_SYNC_QUEUE_URL: props.queues.dataSyncQueue.queueUrl,
        ROLE_NAME: props.role,
        SQS_SUBSCRIBE_QUEUES: props.role === "jobs" ? "true" : "false",
      },
      essential: true,
      taskDefinition: props.task,
      logging: new ecs.AwsLogDriver({
        streamPrefix: `${id}-BackendPublicContainer`,
      }),
    })

    if (props.portMappings) {
      container.addPortMappings(...props.portMappings)
    }

    new cdk.CfnOutput(this, `${id}-BackendContainerName`, {
      value: container.containerName,
    })
  }
}
