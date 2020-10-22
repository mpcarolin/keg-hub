const { git } = require('KegGitCli')
const { getGitPath } = require('KegUtils/git/getGitPath')
const { generalError } = require('KegUtils/error')
const { asyncCmd } = require('@keg-hub/spawn-cmd')
const { promptList } = require('@keg-hub/ask-it')

const listPreviousBranches = async (count=5) => {
  const { data, error } = await asyncCmd(`
    git reflog | egrep -io "moving from ([^[:space:]]+)" | awk '{ print $3 }' | awk ' !x[$0]++' | egrep -v '^[a-f0-9]{40}$' | head -n${count}
  `)

  if (error) {
    console.error(error)
    return null
  }

  const branches = data.split('\n').filter(Boolean)

  const result = await promptList(
    branches,
    'Previous branches', 
    'Select a branch'
  )

  return branches[result]
}

/**
 * Git branch list task. Also allows switching branches
 * @param {string} branch - Branch to run action on
 * @param {Array} branches - Array of all current branches
 * @param {Object} location - Location of the repo for the branches
 * @param {Object} params - Parsed options from the cmd line
 *
 * @returns {void}
 */
const gitPrevious = async (args) => {
  const { globalConfig, params, __internal={} } = args
  const { context, location, tap, list=0 } = params
  const { __skipLog } = __internal

  const gitPath = getGitPath(globalConfig, tap || context) || location
  !gitPath && generalError(`Git path does not exist for ${ tap || context || location }`)

  if (list) {
    const selectedBranch = await listPreviousBranches(list)
    selectedBranch && git.branch.checkout(selectedBranch)
  }
  else {
    await git.branch.checkout('-')
  }
}

module.exports = {
  previous: {
    name: 'previous',
    alias: [ 'prv', 'prev', '-', 'back' ],
    action: gitPrevious,
    description: `Switch to a previous branch.`,
    options: {
      list: {
        alias: ['ls'],
        description: 'Show a list of previous branches',
        example: 'keg git branch --branch my-git-branch',
      },
    }
  }
}
