/** @module hooks */

import { useContext } from 'react'
import { ReThemeContext } from '../context/reThemeContext'

/**
 * Uses the useContext hook from react to get the current theme ( Value prop of the context )
 *
 * @returns { Object } - Current theme
 */
export const useTheme = () => {
  console.log('wow this is a comment')
  return useContext(ReThemeContext)
}
