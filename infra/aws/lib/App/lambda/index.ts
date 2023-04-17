import { Construct } from "constructs"
import { EnvironmentType } from "../../envs"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { DbBackupFunction } from "./functions/db-backup-function"
import { PostgresDatabase } from "../db/postgres"
import { BackendBuckets } from "../backend/buckets"
import { BatchJobsConstruct } from "../backend/batch-jobs"

export interface LambdaProps {
  environment: EnvironmentType
  commitHash: string
  zone: route53.IHostedZone
  vpc: ec2.Vpc
  coreDatabase: PostgresDatabase
  buckets: BackendBuckets
  batches: BatchJobsConstruct
}

export class Lambda extends Construct {
  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id)

    const commonProps = {
      vpc: props.vpc,
      environment: props.environment,
      commitHash: props.commitHash,
      zone: props.zone,
    }

    new DbBackupFunction(this, "DbBackupFunction", {
      ...commonProps,
      memorySize: props.environment.config.lambda.functions.dbBackup.memorySize,
      timeout: props.environment.config.lambda.functions.dbBackup.timeout,
      coreDatabase: props.coreDatabase,
      buckets: props.buckets,
      jobsQueueArn: props.batches.jobsQueue.jobQueueArn,
      dbBackupJobDefinitionArn:
        props.batches.maintenance.job.definition.jobDefinitionArn,
    })
  }
}
