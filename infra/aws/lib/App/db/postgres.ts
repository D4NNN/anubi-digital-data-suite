import * as cdk from "aws-cdk-lib"
import * as rds from "aws-cdk-lib/aws-rds"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as ssm from "aws-cdk-lib/aws-ssm"
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager"
import { EnvironmentType } from "../../envs"
import { Construct } from "constructs"
import { SubnetType } from "aws-cdk-lib/aws-ec2"

export interface DatabaseSettings {
  instanceSize: ec2.InstanceSize
  instanceClass: ec2.InstanceClass
  diskSize: number
  version: rds.PostgresEngineVersion
  databaseName: string
  databaseUser: string
  backupPath?: string
}

export interface RdsProps {
  vpc: ec2.IVpc
  settings: DatabaseSettings
  env: EnvironmentType
}

export class PostgresDatabase extends Construct {
  readonly settings: DatabaseSettings
  readonly secret: secretsManager.Secret
  readonly db: rds.DatabaseInstance
  readonly connectionString: string

  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id)

    this.settings = props.settings

    this.secret = new secretsManager.Secret(this, `DBCredentialsSecret`, {
      secretName: `${props.env.id}-${props.settings.databaseName}-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: props.settings.databaseUser,
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: "password",
      },
    })

    new ssm.StringParameter(this, `DBCredentialsArn`, {
      parameterName: `credentials-arn-${props.settings.databaseName}-${props.env.id}`,
      stringValue: this.secret.secretArn,
    })

    const dbClusterSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBClusterSecurityGroup`,
      { vpc: props.vpc }
    )

    // getting warning alloutbound allowed
    dbClusterSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(5432))

    this.db = new rds.DatabaseInstance(this, `DBInstance`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: props.settings.version,
      }),
      databaseName: props.settings.databaseName,
      instanceType: ec2.InstanceType.of(
        props.settings.instanceClass,
        props.settings.instanceSize
      ),
      deletionProtection: true,
      vpc: props.vpc,
      securityGroups: [dbClusterSecurityGroup],
      allocatedStorage: props.settings.diskSize,
      credentials: {
        username: this.secret.secretValueFromJson("username").toString(),
        password: this.secret.secretValueFromJson("password"),
      },
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
    })

    this.connectionString = `postgres://${this.secret
      .secretValueFromJson("username")
      .toString()}:${this.secret.secretValueFromJson("password").toString()}@${
      this.db.dbInstanceEndpointAddress
    }/${props.settings.databaseName}`

    this.db.connections.allowDefaultPortFromAnyIpv4(
      "Allow RDS Internal Connections"
    )

    new cdk.CfnOutput(this, `rds-db-name`, {
      value: props.settings.databaseName,
    })
    new cdk.CfnOutput(this, `rds-db-host`, {
      value: this.db.dbInstanceEndpointAddress,
    })
    new cdk.CfnOutput(this, `rds-db-arn`, {
      value: this.db.instanceArn,
    })
  }
}
