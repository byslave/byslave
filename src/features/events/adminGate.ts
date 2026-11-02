/** The review queue is for a development build or an explicit admin flag. */
export function showAdminTools(): boolean {
  return (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_ADMIN === 'true';
}
