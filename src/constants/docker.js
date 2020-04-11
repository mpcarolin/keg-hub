const { deepFreeze } = require('jsutils')
const path = require('path')
const cliRootDir = path.join(__dirname, '../../')

const dockerFile = path.join(cliRootDir, 'scripts/docker/Dockerfile')
const corePath = '/keg/tap/node_modules/keg-core'

module.exports = deepFreeze({
  DOCKER: {
    RUN: {
      VALUES: {
        port: '-p 80:19006',
        clean: '--rm',
        attached: '-it',
        detached: '-d',
      },
      DEFAULTS: {
        port: true,
        attached: true,
        clean: true,
        network: true,
      }
    },
    BUILD: {
      VALUES: {
        file: `-f ${dockerFile}`,
        clean: '--rm',
      },
      DEFAULTS: {
        clean: true,
        file: true,
      }
    },
    VOLUMES: {
      PATHS: {
        core: corePath,
        components: `${corePath}/node_modules/keg-components`,
        resolver: `${corePath}/node_modules/keg-components`,
        're-theme': `${corePath}/node_modules/re-theme`,
      },
      DEV_DEFAULTS: [
        'core',
        'components',
        're-theme'
      ]
    }
  }
})