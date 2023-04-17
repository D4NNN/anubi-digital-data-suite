import * as cdk from "aws-cdk-lib"
import { InstanceClass, InstanceSize, SubnetType } from "aws-cdk-lib/aws-ec2"
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds"

export const stagingEnvs = {
  id: "staging",
  name: "staging",
  dnsPrefix: "staging.",
  domainName: "anubi.digital",
  dockerEnvTag: "stg",
  config: {
    infrastructure: {
      vpc: {
        cidr: "10.160.0.0/16",
        maxAzs: 2,
        natGateways: 0,
        subnetConfiguration: [
          {
            cidrMask: 18,
            name: "Public",
            subnetType: SubnetType.PUBLIC,
          },
          {
            cidrMask: 18,
            name: "Private",
            subnetType: SubnetType.PRIVATE_ISOLATED,
          },
        ],
      },
      backups: {
        bucket: "staging-anubi-public-backups",
      },
      postgres: {
        core: {
          instanceClass: InstanceClass.T3,
          instanceSize: InstanceSize.MICRO,
          diskSize: 40,
          version: PostgresEngineVersion.VER_14_2,
          databaseName: "anubiPubCoreStg",
          databaseUser: "anubi_usr_stg",
        },
      },
      backend: {
        apiSubdomain: "pub-api",
        jobsSubdomain: "pub-jobs",
        taskRole: "stagingAnubiPublicBackend",
        services: {
          api: {
            task: {
              memoryLimitMiB: 1024,
              cpu: 512,
            },
            minInstances: 2,
            maxInstances: 2,
          },
          jobs: {
            task: {
              memoryLimitMiB: 1024,
              cpu: 512,
            },
            minInstances: 1,
            maxInstances: 1,
          },
        },
      },
      logging: {
        datadogApiKeySecretName: "datadogApiKey",
      },
      batch: {
        executionRoleName: "anubiPublicBatch",
      },
    },
    backend: {
      buckets: {
        onboardingData: "staging-onboarding-data",
        onboardingDataTokenExpirationDays: 7,
      },
      queues: {
        queueOperationDefaultTimeoutMs: 60000,
        queueOperationDefaultPollingMs: 250,
      },
    },
    lambda: {
      functions: {
        dbBackup: {
          memorySize: 512,
          timeout: cdk.Duration.minutes(2),
        },
      },
    },
    jobs: {
      dbBackup: {
        memoryLimitMiB: 2048,
        vcpus: 1,
      },
    },
    maintenance: {
      dbBackupSchedule: { minute: "0", hour: "4" },
    },
  },
}
