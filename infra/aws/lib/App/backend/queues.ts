import * as cdk from "aws-cdk-lib"
import * as sqs from "aws-cdk-lib/aws-sqs"
import { Construct } from "constructs"
import { EnvironmentType } from "../../envs"

export interface BackendQueuesProps {
  env: EnvironmentType
}

export class BackendQueues extends Construct {
  public readonly inboundEventQueue: sqs.Queue
  public readonly outboundEventQueue: sqs.Queue
  public readonly dataSyncQueue: sqs.Queue

  constructor(scope: Construct, id: string, props: BackendQueuesProps) {
    super(scope, id)

    this.inboundEventQueue = new sqs.Queue(this, "InboundEventsQueue", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      queueName: `${props.env.id}-pb-inbound-events`,
      visibilityTimeout: cdk.Duration.seconds(30),
    })

    this.outboundEventQueue = new sqs.Queue(this, "OutboundEventsQueue", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      queueName: `${props.env.id}-pb-outbound-events`,
      visibilityTimeout: cdk.Duration.seconds(30),
    })

    this.dataSyncQueue = new sqs.Queue(this, "DataSyncQueue", {
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      queueName: `${props.env.id}-pb-data-sync`,
      visibilityTimeout: cdk.Duration.seconds(30),
    })
  }
}
