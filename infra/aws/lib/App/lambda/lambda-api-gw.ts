import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { LambdaFunction } from "./lambda-template"
import { EnvironmentType } from "../../envs"

interface LambdaApiGatewayProps {
  name: string
  lambda: LambdaFunction
  environment: EnvironmentType
}

export class LambdaApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: LambdaApiGatewayProps) {
    super(scope, id)

    const api = new apigateway.LambdaRestApi(
      this,
      `api-${props.name}-${props.environment.id}`,
      {
        handler: props.lambda.function,
      }
    )

    const plan = api.addUsagePlan(
      `UsagePlan-${props.name}-${props.environment.id}`,
      {
        name: "default",
        throttle: {
          rateLimit: 10,
          burstLimit: 2,
        },
      }
    )

    const key = api.addApiKey(`ApiKey-${props.name}-${props.environment.id}`)
    plan.addApiKey(key)
  }
}
