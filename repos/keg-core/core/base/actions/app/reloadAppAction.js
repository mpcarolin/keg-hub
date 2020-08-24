import { SVReload } from 'SVNative'
import { checkCall } from '@svkeg/jsutils'

export const reloadAppAction = async tap => {
  try {
    SVReload && checkCall(SVReload.reload)
  }
  catch (e) {
    console.warn('[ACTION ERROR] Could not reload app!', e)
  }
}
