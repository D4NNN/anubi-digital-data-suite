import * as s3 from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import { EnvironmentType } from "../../envs"

export interface BackendBucketsProps {
  env: EnvironmentType
}

export class BackendBuckets extends Construct {
  readonly backupsBucket: s3.Bucket
  readonly onboardingDataBucket: s3.Bucket

  constructor(scope: Construct, id: string, props: BackendBucketsProps) {
    super(scope, id)

    this.backupsBucket = new s3.Bucket(this, "BackupsBucket", {
      bucketName: props.env.config.infrastructure.backups.bucket,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS_MANAGED,
    })

    this.onboardingDataBucket = new s3.Bucket(this, "OnboardingDataBucket", {
      bucketName: props.env.config.backend.buckets.onboardingData,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS_MANAGED,
    })
  }
}
