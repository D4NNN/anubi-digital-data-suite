import * as cdk from "aws-cdk-lib"
import { InstanceClass, InstanceSize, SubnetType } from "aws-cdk-lib/aws-ec2"
import { PostgresEngineVersion } from "aws-cdk-lib/aws-rds"

export const prodEnvs = {
  id: "prod",
  name: "production",
  dnsPrefix: "",
  domainName: "anubi.digital",
  dockerEnvTag: "prod",
  config: {
    infrastructure: {
      vpc: {
        cidr: "10.161.0.0/16",
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
        bucket: "prod-anubi-public-backups",
      },
      postgres: {
        core: {
          instanceClass: InstanceClass.T4G,
          instanceSize: InstanceSize.MICRO,
          diskSize: 100,
          version: PostgresEngineVersion.VER_14_2,
          databaseName: "anubiPubCore",
          databaseUser: "anubi_usr",
        },
      },
      backend: {
        apiSubdomain: "pub-api",
        jobsSubdomain: "pub-jobs",
        taskRole: "prodAnubiPublicBackend",
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
        onboardingData: "prod-onboarding-data",
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
