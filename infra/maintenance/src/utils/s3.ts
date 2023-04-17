import * as AWS from "aws-sdk"
import fs from "fs"

export interface PutFileInput {
  bucket: string
  path: string
  sourcePath: string
}

const s3Client = () =>
  new AWS.S3({
    credentials:
      process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  })

export const putFile = async (input: PutFileInput) => {
  const stream = fs.createReadStream(input.sourcePath)
  const result = await s3Client()
    .putObject({
      Bucket: input.bucket,
      Key: input.path,
      Body: stream,
    })
    .promise()
  if (result.$response.error) {
    throw result.$response.error
  }
  return result.$response.data as AWS.S3.PutObjectOutput
}
