import { Construct } from "constructs"
import * as batch from "@aws-cdk/aws-batch-alpha"
import { EnvironmentType } from "../../envs"
import { ContainerImage } from "aws-cdk-lib/aws-ecs"
import { Role } from "aws-cdk-lib/aws-iam"
import { Stack } from "aws-cdk-lib"

interface FargateJobSettings {
  vcpus: number
  memoryLimitMiB: number
}

interface FargateJobProps {
  settings: FargateJobSettings
  jobName: string
  image: ContainerImage
  command: string[]
  environment: EnvironmentType
  environmentVariables?: {
    [key: string]: string
  }
}

export class FargateJob extends Construct {
  public readonly definition: batch.JobDefinition

  constructor(scope: Construct, id: string, props: FargateJobProps) {
    super(scope, id)

    const executionRole = Role.fromRoleArn(
      this,
      `exec-role-${id}`,
      `arn:aws:iam::${Stack.of(this).account}:role/${
        props.environment.config.infrastructure.batch.executionRoleName
      }`,
      { mutable: false }
    )

    this.definition = new batch.JobDefinition(this, `FargateJob-${id}`, {
      jobDefinitionName: `${props.jobName}-${props.environment.id}`,
      container: {
        image: props.image,
        command: props.command,
        assignPublicIp: true,
        environment: {
          ...props.environmentVariables,
        },
        logConfiguration: {
          logDriver: batch.LogDriver.AWSLOGS,
        },
        vcpus: props.settings.vcpus,
        memoryLimitMiB: props.settings.memoryLimitMiB,
        executionRole,
      },
      platformCapabilities: [batch.PlatformCapabilities.FARGATE],
    })
  }
}
