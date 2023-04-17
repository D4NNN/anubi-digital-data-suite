import { exec } from "shelljs"

export const run = (command: string, whatIf = false) => {
  console.log(`RUN -> ${command}`)
  if (!whatIf) {
    exec(command)
  }
}
