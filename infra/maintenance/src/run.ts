import * as dotenv from "dotenv"
import "source-map-support/register"
import yargs from "yargs/yargs"
import { createPostgresBackup, PostgresBackupInput } from "./tasks/pg-backup"

dotenv.config()

const argv = yargs(process.argv.slice(2)).options({
  whatIf: { type: "boolean", alias: "wi" },
}).argv

const now = new Date()
const buildDbBackupPath = (name: string) =>
  `db/${name}/${now.getFullYear()}/${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`

const buildLocalFilePath = (fileSuffix: string) =>
  `${now.toISOString()}_${fileSuffix}`

const backupParams = [
  {
    connectionString: process.env.DB_CORE_CONNECTION_STRING ?? "",
    name: "core",
    fileSuffix: "core.dump",
    backupFunc: async (input: PostgresBackupInput) =>
      await createPostgresBackup(input),
  },
  // disabled because of aws error:	pg_dumpall: error: query failed: ERROR: permission denied for table pg_authid
  // {
  //   connectionString: process.env.DB_CORE_CONNECTION_STRING ?? "",
  //   name: "roles",
  //   fileSuffix: "roles.dump",
  //   backupFunc: async (input: PostgresBackupInput) =>
  //     await createPostgresRolesBackup(input),
  // },
]

const main = async () => {
  const args = await argv
  console.log("Maintenance task started")
  for (const backup of backupParams) {
    console.log(`Backup task -> ${backup.name}`)
    await backup?.backupFunc({
      whatIf: args.whatIf ?? false,
      connectionString: backup.connectionString,
      fileName: buildLocalFilePath(backup.fileSuffix),
      s3TargetPath: buildDbBackupPath(backup.name),
    })
  }
  console.log("Maintenance task completed")
}

main()
