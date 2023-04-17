import { Construct } from "constructs"
import * as ecr from "aws-cdk-lib/aws-ecr"
import * as ecs from "aws-cdk-lib/aws-ecs"
import { EnvironmentType } from "../../../envs"
import { FargateJob } from "../fargate-job"
import { PostgresDatabase } from "../../db/postgres"
import { Bucket } from "aws-cdk-lib/aws-s3"

interface DbMaintenanceJobProps {
  environment: EnvironmentType
  commitHash: string
  coreDatabase: PostgresDatabase
  backupsBucket: Bucket
}

export class DbMaintenanceJob extends Construct {
  public readonly job: FargateJob
  constructor(scope: Construct, id: string, props: DbMaintenanceJobProps) {
    super(scope, id)
    const imageRepo = ecr.Repository.fromRepositoryName(
      this,
      `anubi-maintenance-repo`,
      "anubi-digital/maintenance-pb"
    )
    const imageTag = `${props.environment.dockerEnvTag}-${props.commitHash}`

    this.job = new FargateJob(this, `DbBackup`, {
      environment: props.environment,
      command: ["yarn", "start"],
      jobName: "dbBackup",
      image: ecs.ContainerImage.fromEcrRepository(imageRepo, imageTag),
      environmentVariables: {
        DB_CORE_CONNECTION_STRING: props.coreDatabase.connectionString,
        BACKUPS_BUCKET: props.backupsBucket.bucketName,
      },
      settings: {
        memoryLimitMiB: props.environment.config.jobs.dbBackup.memoryLimitMiB,
        vcpus: props.environment.config.jobs.dbBackup.vcpus,
      },
    })
  }
}
