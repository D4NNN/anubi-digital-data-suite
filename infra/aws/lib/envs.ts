import * as path from "path"
import { prodEnvs } from "../envs/prod"
import { stagingEnvs } from "../envs/staging"
import { testEnvs } from "../envs/test"

export type EnvironmentType = typeof prodEnvs

export interface EnvironmentsType {
  Test: EnvironmentType
  Staging: EnvironmentType
  Production: EnvironmentType
}

export const Environment = {
  Test: testEnvs,
  Staging: stagingEnvs,
  Production: prodEnvs,
}

const rootDir =
  process.env.PROJ_ROOT_DIR || path.join(__dirname, "..", "..", "..")

export const staticSites = [
  {
    id: "fe-onboarding",
    assetsPath: path.join(rootDir, "app", "frontend", "onboarding", "out"),
    domainName: "anubi.digital",
    siteSubDomain: "onboarding",
  },
  {
    id: "fe-landing",
    assetsPath: path.join(rootDir, "app", "frontend", "landing", "out"),
    domainName: "anubi.digital",
    siteSubDomain: "www",
  },
]

export type StaticSiteParams = typeof staticSites[0]

export const appParams = {
  apiSubDomain: "pb-api",
  jobsSubDomain: "pb-jobs",
}

export type AppParams = typeof appParams
