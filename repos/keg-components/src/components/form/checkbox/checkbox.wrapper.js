import React, {
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { View } from 'KegView'
import PropTypes from 'prop-types'
import { Text } from '../../typography'
import { useThemePath } from '../../../hooks'
import { useThemeTypeAsClass } from 'KegTypeAsClass'
import { get, isStr, toBool, checkCall } from '@keg-hub/jsutils'
import { getOnChangeHandler, getChecked, renderFromType } from '../../../utils'
import { useClassList } from 'KegClassList'

/**
 * Optimizes the check and non-checked styles so they don't have to be rebuilt on each render
 * Checked styles only rebuild when isChecked value has changed
 * @param {boolean} isChecked - Current state of the switch component
 * @param {Object} themeStyles - Styles of the Switch component
 *
 * @returns {Object} - Styles with the correct values based on isChecked state
 */
const useCheckedState = (isChecked, themeStyles) => {
  return useMemo(() => {
    return {
      ...themeStyles,
      content: {
        ...themeStyles.content,
        area: {
          ...get(themeStyles, 'content.area.off'),
          ...(isChecked && get(themeStyles, 'content.area.on')),
        },
        indicator: {
          ...get(themeStyles, 'content.indicator.off'),
          ...(isChecked && get(themeStyles, 'content.indicator.on')),
        },
      },
    }
  }, [ isChecked, themeStyles ])
}

/**
 * Returns a memoized callback that sets / updates the value of the checked Component and
 * calls the callback, if it's passed in
 * @param {boolean} isChecked - Current state of the check value
 * @param {function} setChecked - Update the checked state
 * @param {function} onChange - Callback to call when the state changes
 * @param {boolean} options.disableCheck - `setChecked` can only be called with `true` if this value is false
 * @param {boolean} options.disableUncheck - `setChecked` can only be called with `false` if this value is also false
 *
 * @returns {function} - The checked state update function
 */
const useCheckboxPressHandler = (
  isChecked,
  setChecked,
  onChange,
  { disableCheck = false, disableUncheck = true }
) => {
  return useCallback(
    event => {
      if (isChecked) !disableUncheck && setChecked(false)
      else !disableCheck && setChecked(true)
      checkCall(onChange, event, !isChecked)
    },
    [ isChecked, setChecked, onChange, disableCheck, disableUncheck ]
  )
}

/**
 * Side
 * @summary builds the side sections of the Switch
 * @param {Object} props
 * @property {React Component|string|Object|Array} Component  - custom component to display in the section.
 * @property {Object} style - default headerstyle obj for section
 *
 * @returns {Component} - section component
 */
const SideComponent = ({ className, Component, styles, style, onPress }) => {
  const sideProps = onPress ? { onPress } : undefined
  return isStr(Component) ? (
    <Text
      className={className}
      style={style}
      {...sideProps}
    >
      { Component }
    </Text>
  ) : (
    renderFromType(Component, {
      className,
      style,
      styles,
      ...sideProps,
    })
  )
}

/**
 * Finds the children type and returns them in the format needed to render
 * @param {Object|Array|string} props.children - Child components to render
 *
 * @returns {React Component|Object|Array}
 */
const ChildrenComponent = ({ children, className }) => (
  <>{ renderFromType(children, { className }, null) }</>
)

/**
 * Exposes an imperative api for the consumer of checkbox
 * @param {RefObject} ref
 * @param {boolean} isChecked
 * @param {Function} setChecked
 * @param {Function} pressHandler - fn responsible for handling presses of the checkbox
 */
const useCheckboxHandle = (ref, isChecked, setChecked, pressHandler) => {
  return useImperativeHandle(
    ref,
    () => ({
      // allows consumer to fetch the latest checked value
      isChecked,

      // allows consumer to toggle the checked value, which will
      // also fire the pressHandler
      setChecked: checked => {
        setChecked(checked)
        pressHandler({}, checked)
      },
    }),
    [ ref, isChecked, setChecked, pressHandler ]
  )
}

/**
 * CheckboxWrapper
 * Wraps the Passed in Checkbox Element
 * @param {Object} props - see PropTypes below
 * @param {string?} props.className - css class string
 * @param {boolean?} props.initChecked - the initial checked/unchecked value of Checkbox
 * @param {boolean?} props.checked - alias for initChecked
 * @param {Object | String | Array} props.children - react children
 * @param {string} props.elType - type of checkbox
 * @param {Component} props.Element - the which component used for the core checkbox ui. @see checkbox.js
 * @param {Component?} props.CheckIcon - an optional component that overrides the icon used in the checkbox
 * @param {boolean} props.disabled - disables checking and unchecking if true
 * @param {boolean} props.disableCheck - disables checking if true
 * @param {boolean} props.disableUncheck - disables unchecking if true
 * @param {boolean} props.allowAdjacentPress - if true, allows pressing a side component to toggle the checkbox
 * @param {boolean} props.isWeb - indicates current platform is web. Provide by checkbox.js
 * @param {(Component | string)?} props.LeftComponent - an optional component or string to render left of the checkbox
 * @param {string?} props.leftClassName - optional class name for the left component
 * @param {boolean} props.close - if true, side components will be rendered close to the checkbox. If false, spaced apart.
 * @param {Function?} props.onChange - callback fired when checkbox is toggled
 * @param {Function?} props.onValueChange - callback fired when checkbox is toggled
 * @param {(Component | string)?} props.RightComponent -  an optional component or string to render right of the checkbox
 * @param {string?} props.rightClassName - optional class name for the right component
 * @param {Object} props.styles - styles that overwrite default checkbox styles
 * @param {Component?} props.CheckboxComponent - an optional component that overrides the default checkbox element, passed the same props and styles
 * @param {string} props.type - theme type
 * @param {string} props.themePath - path to theme object
 * @param {boolean} props.value - alias for initChecked
 * @param {...rest} props.* - the remaining props are passed to Element
 */
export const CheckboxWrapper = forwardRef((props, ref) => {
  const {
    className,
    initChecked,
    checked,
    children,
    elType,
    Element,
    CheckIcon,
    disabled,
    disableCheck = false,
    disableUncheck = false,
    allowAdjacentPress = true,
    isWeb,
    LeftComponent,
    leftClassName,
    close,
    onChange,
    onValueChange,
    RightComponent,
    rightClassName,
    styles,
    CheckboxComponent,
    type,
    themePath,
    value,
    ...elProps
  } = props

  const initCheckedValue = toBool(checked || initChecked || value)

  const [ isChecked, setChecked ] = useState(initCheckedValue)

  // makes the pressHandler function for the checkbox.
  // if disableCheck is true, prevents isChecked being set to true,
  // if disableUncheck is true, prevents isChecked being set to false.
  const pressHandler = useCheckboxPressHandler(
    isChecked,
    setChecked,
    onChange || onValueChange, // support either callback name from consumer
    { disableCheck, disableUncheck }
  )

  // by default, checkbox manages its own toggled state.
  // however, if the consumer needs to control that, it can by passing
  // in `ref`, then calling ref.current.setChecked to control the value
  useCheckboxHandle(ref, isChecked, setChecked, onChange || onValueChange)

  // determine if the handler can be fired, so long as the next check state is allowed
  const canUseHandler =
    !disabled &&
    ((isChecked && !disableUncheck) || (!isChecked && !disableCheck))

  const elThemePath =
    themePath || `form.${elType}.${(close && 'close') || 'default'}`

  const themeStyles = useThemePath(elThemePath, styles)
  const disabledStyles = useThemePath(`form.${elType}.disabled`, themeStyles)
  const activeStyles = useCheckedState(
    isChecked,
    canUseHandler ? themeStyles : disabledStyles
  )

  const typeClassName = useThemeTypeAsClass(
    elThemePath || type,
    'keg-checkbox',
    className
  )

  // returns the right props to use
  const pressHandlerProp = canUseHandler
    ? getOnChangeHandler(isWeb, pressHandler)
    : undefined

  const ChildrenView = children && (
    <View
      className={typeClassName}
      style={activeStyles.main}
    >
      <ChildrenComponent
        className='keg-checkbox-container'
        children={children}
      />
    </View>
  )

  return (
    ChildrenView || (
      <View
        className={typeClassName}
        style={activeStyles.main}
      >
        { LeftComponent && (
          <SideComponent
            className={useClassList('keg-checkbox-left', leftClassName)}
            Component={LeftComponent}
            style={activeStyles.content.left}
            onPress={allowAdjacentPress && canUseHandler && pressHandler}
          />
        ) }

        { CheckboxComponent ? (
          renderFromType(CheckboxComponent, {
            ...props,
            styles: activeStyles.content,
          })
        ) : (
          <Element
            className='keg-checkbox-container'
            elProps={elProps}
            disabled={disabled}
            styles={activeStyles.content}
            CheckIcon={CheckIcon}
            {...getChecked(isWeb, isChecked)}
            {...pressHandlerProp}
          />
        ) }

        { RightComponent && (
          <SideComponent
            className={useClassList('keg-checkbox-right', rightClassName)}
            Component={RightComponent}
            style={activeStyles.content.right}
            onPress={allowAdjacentPress && canUseHandler && pressHandler}
          />
        ) }
      </View>
    )
  )
})

CheckboxWrapper.propTypes = {
  checked: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
  ]),
  disabled: PropTypes.bool,
  isWeb: PropTypes.bool,
  Element: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
    PropTypes.func,
    PropTypes.element,
  ]),
  LeftComponent: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
    PropTypes.func,
    PropTypes.element,
  ]),
  RightComponent: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
    PropTypes.func,
    PropTypes.element,
  ]),
  CheckboxComponent: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.array,
    PropTypes.func,
    PropTypes.element,
  ]),
  CheckIcon: PropTypes.oneOfType([ PropTypes.func, PropTypes.element ]),
  onChange: PropTypes.func,
  onValueChange: PropTypes.func,
  styles: PropTypes.object,
  text: PropTypes.string,
  themePath: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.bool,
  disableCheck: PropTypes.bool,
  disableUncheck: PropTypes.bool,
  allowAdjacentPress: PropTypes.bool,
}
