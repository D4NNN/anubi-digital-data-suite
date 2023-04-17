import { Construct } from "constructs"
import * as batch from "@aws-cdk/aws-batch-alpha"
import { EnvironmentType } from "../../envs"
import { DbMaintenanceJob } from "../batch/jobs/db-maintenance-job"
import { PostgresDatabase } from "../db/postgres"
import { BackendBuckets } from "./buckets"

interface BatchJobsProps {
  environment: EnvironmentType
  computeEnvironment: batch.ComputeEnvironment
  jobsQueue: batch.JobQueue
  commitHash: string
  coreDatabase: PostgresDatabase
  buckets: BackendBuckets
}

export class BatchJobsConstruct extends Construct {
  public readonly jobsQueue: batch.JobQueue
  public readonly maintenance: DbMaintenanceJob

  constructor(scope: Construct, id: string, props: BatchJobsProps) {
    super(scope, id)

    this.jobsQueue = props.jobsQueue

    this.maintenance = new DbMaintenanceJob(this, `DbBackup`, {
      environment: props.environment,
      commitHash: props.commitHash,
      coreDatabase: props.coreDatabase,
      backupsBucket: props.buckets.backupsBucket,
    })
  }
}
