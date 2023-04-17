import { Construct } from "constructs"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as events from "aws-cdk-lib/aws-events"
import * as targets from "aws-cdk-lib/aws-events-targets"
import * as route53 from "aws-cdk-lib/aws-route53"
import { Duration } from "aws-cdk-lib"
import { EnvironmentType } from "../../../envs"
import { LambdaFunction } from "../lambda-template"
import { PostgresDatabase } from "../../db/postgres"
import { BackendBuckets } from "../../backend/buckets"
import { LambdaApiGateway } from "../lambda-api-gw"

interface DbBackupFunctionProps {
  zone: route53.IHostedZone
  environment: EnvironmentType
  commitHash: string
  coreDatabase: PostgresDatabase
  buckets: BackendBuckets
  vpc: ec2.Vpc
  timeout: Duration
  memorySize: number
  jobsQueueArn: string
  dbBackupJobDefinitionArn: string
}

export class DbBackupFunction extends Construct {
  constructor(scope: Construct, id: string, props: DbBackupFunctionProps) {
    super(scope, id)

    const lambda = new LambdaFunction(scope, `Function-${id}`, {
      commitHash: props.commitHash,
      memorySize: props.memorySize,
      environment: props.environment,
      timeout: props.timeout,
      vpc: props.vpc,
      functionName: "dbBackup",
      handlerPath: "db-backup/index.handler",
      environmentVariables: {
        DB_BACKUP_JOB_QUEUE_ARN: props.jobsQueueArn,
        DB_BACKUP_JOB_DEFINITION_ARN: props.dbBackupJobDefinitionArn,
      },
    })

    const eventRule = new events.Rule(this, "cron", {
      schedule: events.Schedule.cron(
        props.environment.config.maintenance.dbBackupSchedule
      ),
    })
    eventRule.addTarget(new targets.LambdaFunction(lambda.function))

    new LambdaApiGateway(this, `LambdaApiGateway-${id}`, {
      lambda,
      environment: props.environment,
      name: "DbBackup",
    })
  }
}
