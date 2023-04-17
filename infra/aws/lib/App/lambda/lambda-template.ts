import { Construct } from "constructs"
import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2"
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager"
import * as ecr from "aws-cdk-lib/aws-ecr"
import * as iam from "aws-cdk-lib/aws-iam"
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda"
import { EnvironmentType } from "../../envs"
import { Duration } from "aws-cdk-lib"

export interface LambdaFunctionProps {
  commitHash: string
  environment: EnvironmentType
  vpc: Vpc
  timeout: Duration
  memorySize: number
  functionName: string
  handlerPath: string
  environmentVariables?: {
    [key: string]: string
  }
}

export class LambdaFunction extends Construct {
  public readonly function: DockerImageFunction
  public readonly name: string

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id)

    this.name = props.functionName

    const datadogApiKey = secretsManager.Secret.fromSecretNameV2(
      this,
      "DatadogApiKey",
      props.environment.config.infrastructure.logging.datadogApiKeySecretName
    )

    // new lambda.NodejsFunction(this, `Lambda-${id}`, {
    //   entry: resolve(__dirname, props.path),
    //   vpc: props.vpc,
    //   functionName: `${props.environment.id}-${props.functionName}`,
    //   handler: props.handler,
    //   memorySize: props.memorySize,
    //   timeout: props.timeout,
    //   bundling: {
    //     // minify: true, // minify code, defaults to false
    //     sourceMap: true, // include source map, defaults to false
    //     // sourceMapMode: lambda.SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
    //     // sourcesContent: false, // do not include original source into source map, defaults to true
    //     target: "es2020", // target environment for the generated JavaScript code
    //   },
    //   runtime: {
    //     bundlingImage: DockerImage.fromBuild(
    //       "../../../../../app/lambda/Dockerfile"
    //     ),
    //     name: "AnubiLambdaEnv",
    //     supportsCodeGuruProfiling: false,
    //     supportsInlineCode: false,
    //   },
    //   environment: {
    //     ENVIRONMENT_NAME: props.environment.name,
    //     ROLE_NAME: "function",
    //     DATADOG_ENABLED: "true",
    //     DATADOG_API_KEY: datadogApiKey.secretValueFromJson("value").toString(),
    //     FUNCTION_NAME: props.functionName,
    //     ...props.environmentVariables,
    //   },
    // })

    this.function = new DockerImageFunction(this, `Lambda-${id}`, {
      // vpc: props.vpc,
      // vpcSubnets: {
      //   subnetType: SubnetType.PRIVATE_ISOLATED,
      // },
      // allowAllOutbound: true,
      // allowPublicSubnet: true,
      functionName: `${props.environment.id}-${props.functionName}`,
      memorySize: props.memorySize,
      timeout: props.timeout,
      code: DockerImageCode.fromEcr(
        ecr.Repository.fromRepositoryName(
          this,
          `anubi-digital-repo`,
          "anubi-digital/lambda-pb"
        ),
        {
          tag: `${props.environment.dockerEnvTag}-${props.commitHash}`,
          cmd: [`dist/${props.handlerPath}`],
        }
      ),
      environment: {
        NODE_OPTIONS: "--enable-source-maps",
        ENVIRONMENT_NAME: props.environment.name,
        ROLE_NAME: "function",
        DATADOG_ENABLED: "true",
        DATADOG_API_KEY: datadogApiKey.secretValueFromJson("value").toString(),
        FUNCTION_NAME: props.functionName,
        ...props.environmentVariables,
      },
    })

    const lambdaPolicy = new iam.PolicyStatement()
    lambdaPolicy.addActions("*")
    lambdaPolicy.addAllResources()
    this.function.addToRolePolicy(lambdaPolicy)
  }
}
