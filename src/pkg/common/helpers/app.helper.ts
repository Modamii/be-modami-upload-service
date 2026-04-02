import semver from 'semver';

import { MINIMUM_VERSION_SUPPORT, VERSIONS_SUPPORTED } from '../constants';

export class AppHelper {
  public static getVersionsSupported(): string[] {
    return VERSIONS_SUPPORTED.filter((version) =>
      semver.gte(version, MINIMUM_VERSION_SUPPORT),
    );
  }

  public static getVersionsSupportedFrom(minVersion: string): string[] {
    return VERSIONS_SUPPORTED.filter((version) =>
      semver.gte(version, minVersion),
    );
  }

  public static getVersionsSupportedTo(maxVersion: string): string[] {
    return VERSIONS_SUPPORTED.filter((version) =>
      semver.lte(version, maxVersion),
    );
  }
}
