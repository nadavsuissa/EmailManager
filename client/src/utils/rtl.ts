import i18n from '../i18n/i18n';

/**
 * RTL (Right-to-Left) Utilities
 * 
 * This module provides functions and constants for RTL support in the application.
 */

/**
 * Check if the current language direction is RTL
 */
export const isRtl = (): boolean => {
  return i18n.language === 'he' || document.dir === 'rtl';
};

/**
 * Set the document direction based on the current language
 */
export const setDocumentDirection = (language: string): void => {
  document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
};

/**
 * Get text alignment based on current direction
 */
export const getTextAlign = (): 'right' | 'left' => {
  return isRtl() ? 'right' : 'left';
};

/**
 * Get reverse text alignment based on current direction
 */
export const getReverseTextAlign = (): 'right' | 'left' => {
  return isRtl() ? 'left' : 'right';
};

/**
 * Get flex direction based on current direction
 */
export const getFlexDirection = (): 'row' | 'row-reverse' => {
  return isRtl() ? 'row-reverse' : 'row';
};

/**
 * Get start padding/margin property name based on current direction
 */
export const getPaddingStart = (): 'paddingRight' | 'paddingLeft' => {
  return isRtl() ? 'paddingRight' : 'paddingLeft';
};

/**
 * Get end padding/margin property name based on current direction
 */
export const getPaddingEnd = (): 'paddingRight' | 'paddingLeft' => {
  return isRtl() ? 'paddingLeft' : 'paddingRight';
};

/**
 * Get margin start property name based on current direction
 */
export const getMarginStart = (): 'marginRight' | 'marginLeft' => {
  return isRtl() ? 'marginRight' : 'marginLeft';
};

/**
 * Get margin end property name based on current direction
 */
export const getMarginEnd = (): 'marginRight' | 'marginLeft' => {
  return isRtl() ? 'marginLeft' : 'marginRight';
};

/**
 * Convert a value to RTL friendly (for margins, paddings etc.)
 */
export const rtlValue = (
  ltrValue: number | string,
  rtlValue?: number | string
): number | string => {
  if (rtlValue !== undefined) {
    return isRtl() ? rtlValue : ltrValue;
  }
  return ltrValue;
};

/**
 * Get a CSS transform for mirroring in RTL mode
 */
export const getMirrorTransform = (): string => {
  return isRtl() ? 'scaleX(-1)' : 'none';
};

export default {
  isRtl,
  setDocumentDirection,
  getTextAlign,
  getReverseTextAlign,
  getFlexDirection,
  getPaddingStart,
  getPaddingEnd,
  getMarginStart,
  getMarginEnd,
  rtlValue,
  getMirrorTransform
}; 