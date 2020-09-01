const yargs = require('yargs')
const execa = require('execa')
const getPackageDir = require('./utils/getPackageDir')

const argv = yargs
  .option('all', {
    alias: 'a',
    type: 'boolean',
    description: 'build all project.'
  })
  .option('projects', {
    alias: 'p',
    type: 'array',
    description: 'project to build.'
  })
  .option('watch', {
    alias: 'w',
    type: 'boolean',
    description: 'watch project.'
  })
  .argv

if (argv.all) {
  execa('tsc',
    [
      '-b',
      ...(argv.watch ? ['-w']: [])
    ],
    {
      stdio: "inherit",
    }
  )
} else {
  argv.projects.forEach((project) => {
    console.log(`build ${project} ...`)
    execa('tsc',
      [
        ...(argv.projects.length === 1 && argv.watch ? ['-w']: [])
      ],
      {
        cwd: getPackageDir(project),
        stdio: "inherit",
      }
    )
    .addListener('close', () => {
      console.log(`build ${project} success.`)
    })
  })
}
