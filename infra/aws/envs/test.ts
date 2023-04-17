import * as cdk from "aws-cdk-lib"
import { InstanceClass, InstanceSize, SubnetType } from "aws-cdk-lib/aws-ec2"
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds"

export const testEnvs = {
  id: "test",
  name: "test",
  dnsPrefix: "test.",
  domainName: "anubi.digital",
  dockerEnvTag: "test",
  config: {
    infrastructure: {
      vpc: {
        cidr: "10.159.0.0/16",
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
            name: "Isolated",
            subnetType: SubnetType.PRIVATE_ISOLATED,
          },
        ],
      },
      backups: {
        bucket: "test-anubi-public-backups",
      },
      postgres: {
        core: {
          instanceClass: InstanceClass.T4G,
          instanceSize: InstanceSize.MICRO,
          diskSize: 40,
          version: PostgresEngineVersion.VER_14_2,
          databaseName: "anubiPubCoreTest",
          databaseUser: "anubi_usr_test",
        },
      },
      backend: {
        apiSubdomain: "pub-api",
        jobsSubdomain: "pub-jobs",
        taskRole: "testAnubiPublicBackend",
        services: {
          api: {
            task: {
              memoryLimitMiB: 1024,
              cpu: 512,
            },
            minInstances: 1,
            maxInstances: 1,
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
        onboardingData: "test-onboarding-data",
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
