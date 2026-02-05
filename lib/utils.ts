/**
 * Utility function to conditionally join class names.
 * Similar to the popular 'classnames' package.
 */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
