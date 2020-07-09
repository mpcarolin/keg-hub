const { reduceObj } = require('@ltipton/jsutils')
const { generalError } = require('../error/generalError')
const { getTapPath } = require('../globalConfig/getTapPath')
const { getContext } = require('../getters/getContext')
const { getContainerConst } = require('../docker/getContainerConst')

/**
 * Gets the cmdContext for the task based on the passed in params
 * @function
 * @param {string} context - Context to run the docker container in
 *
 * @returns {Object} - ENVs for the context
 */
const buildCmdContext = async ({ globalConfig, params, allowed, askContainer }) => {
  const { tap, container } = params

  // Check if the context is prefixed with `keg`
  // If it is, remove it. This allows passing in "keg-core" or just "core"
  const contextData = await getContext(params, askContainer)
  const { context } = contextData

  // If context is not a tap, then just return the cmdContext
  if(context !== 'tap')
    return { ...contextData, cmdContext: context, tap: context }

  // Check if the context or the tap, has a tap path
  // This allow passing the tap in as the context
  const hasTapPath = getTapPath(globalConfig, context) ||
    ( tap && getTapPath(globalConfig, tap) )

  // Get the context the command should be run in
  // If there is a tap path, then use the tap, else use the context || defContext
  const cmdContext = hasTapPath ? 'tap' : context

  // Ensure we have a valid context to run the command in
  !cmdContext && (!contextData.image || !contextData.id) && generalError(
    `The context "${ context }" is invalid. A valid "context" is required!`
  )

  return { ...contextData, cmdContext, tap: tap || context }
}


module.exports = {
  buildCmdContext
}