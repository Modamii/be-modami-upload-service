/**
 * Used for private-ops: bypass user authentication and authorization
 */
export const SYSTEM_ACTOR = {
  id: '00000000-0000-0000-0000-000000000000',
  fullname: 'SYSTEM',
  username: 'SYSTEM',
};
export const PRIVATE_OPS_PATH = 'private-ops';
export const IsPrivateOps = (url: string) =>
  url.replace(/^\//, '').startsWith(PRIVATE_OPS_PATH);

export const WHITELIST_PATH = [
  'health/livez',
  'health/readyz',
  '/videos/:id/kaltura/:format',
  '/internal/(.*)',
  `/${PRIVATE_OPS_PATH}/(.*)`,
];
