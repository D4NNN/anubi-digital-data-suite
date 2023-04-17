import { EnvironmentType } from "../lib/envs"

const getDnsPrefix = (subdomain: string, environment: EnvironmentType) =>
  `${environment.dnsPrefix}${subdomain ? `${subdomain}.` : ""}`

export const buildDns = (
  subdomain: string,
  environment: EnvironmentType,
  domainName?: string
) =>
  `${getDnsPrefix(subdomain, environment)}${
    domainName ?? environment.domainName
  }`

export const vpcName = (stack: string, environment: EnvironmentType) =>
  `${environment.id}-${stack}-vpc`
