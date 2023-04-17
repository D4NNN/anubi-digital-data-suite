import * as route53 from "aws-cdk-lib/aws-route53"
import { Construct } from "constructs"
import { EnvironmentType } from "../lib/envs"

export const lookupRoute53Zone = (scope: Construct, domainName: string) =>
  route53.HostedZone.fromLookup(scope, "Zone", {
    domainName,
  })

export const lookupDefaultRoute53Zone = (
  scope: Construct,
  environment: EnvironmentType
) =>
  route53.HostedZone.fromLookup(scope, "Zone", {
    domainName: environment.domainName,
  })
