import { Construct } from "constructs"
import * as batch from "@aws-cdk/aws-batch-alpha"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import { EnvironmentType } from "../../envs"

export interface BatchProps {
  environment: EnvironmentType
  vpc: ec2.Vpc
}

export class BatchEnvironment extends Construct {
  public readonly computeEnvironment: batch.ComputeEnvironment
  public readonly jobsQueue: batch.JobQueue

  constructor(scope: Construct, id: string, props: BatchProps) {
    super(scope, id)

    const computeEnvironment = new batch.ComputeEnvironment(
      this,
      "Batch-Compute-Env",
      {
        computeEnvironmentName: `BatchCluster-${props.environment.id}`,
        computeResources: {
          vpc: props.vpc,
          type: batch.ComputeResourceType.FARGATE,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
        },
      }
    )

    const jobsQueue = new batch.JobQueue(this, "JobsQueue", {
      jobQueueName: `jobs-queue-${props.environment.name}`,
      computeEnvironments: [
        {
          computeEnvironment,
          order: 1,
        },
      ],
    })

    this.computeEnvironment = computeEnvironment
    this.jobsQueue = jobsQueue
  }
}
