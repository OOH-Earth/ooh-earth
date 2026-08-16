import { useRef } from 'react';

/**
 * Makes a `<label>`-wrapped `<input type="file" className="hidden">`
 * keyboard-operable. A hidden (`display:none`) input is removed from the
 * tab order entirely -- clicking the label works with a mouse, but there is
 * no way to reach or activate the control with a keyboard, verified live
 * via real Tab-traversal (see /trash's fix, the reference case for this
 * pattern). Spread `labelProps` on the label and `inputProps` on the input;
 * everything else (styling, drag/drop, onChange) stays exactly as-is.
 *
 * @param {boolean} [disabled] - e.g. an in-flight upload/analysis
 */
export function useKeyboardFilePicker(disabled = false) {
  const inputRef = useRef(null);

  const labelProps = {
    tabIndex: disabled ? -1 : 0,
    role: 'button',
    'aria-disabled': disabled,
    onKeyDown: (e) => {
      if (disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
  };

  const inputProps = { ref: inputRef, tabIndex: -1 };

  return { inputRef, labelProps, inputProps };
}
