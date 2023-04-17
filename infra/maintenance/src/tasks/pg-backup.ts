import { putFile } from "../utils/s3"
import { run } from "../utils/shell"

export interface PostgresBackupInput {
  connectionString: string
  fileName: string
  s3TargetPath: string
  whatIf: boolean
}

export const createPostgresRolesBackup = async (input: PostgresBackupInput) => {
  const { connectionString, fileName, s3TargetPath, whatIf } = input

  run(
    `pg_dumpall --roles-only --dbname ${connectionString} > ${fileName} | gzip ${fileName}`,
    whatIf
  )
  await uploadDump({ fileName: `${fileName}.gz`, s3TargetPath })
}

export const createPostgresBackup = async (input: PostgresBackupInput) => {
  const { connectionString, fileName, s3TargetPath, whatIf } = input
  run(
    `pg_dump --dbname ${connectionString} --format=tar --file ${fileName}`,
    whatIf
  )
  await uploadDump({ fileName, s3TargetPath })
}

const uploadDump = async (input: {
  s3TargetPath: string
  fileName: string
}) => {
  const { s3TargetPath, fileName } = input

  if (!process.env.BACKUPS_BUCKET) {
    throw new Error(`Missing backups bucket`)
  }

  console.log(`Uploading file ${fileName} to s3 path ${s3TargetPath}`)
  await putFile({
    sourcePath: fileName,
    bucket: process.env.BACKUPS_BUCKET,
    path: `${s3TargetPath}/${fileName}`,
  })
}
