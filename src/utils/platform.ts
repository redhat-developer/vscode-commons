import * as os from 'os';
import osLocale from 'os-locale';

export const PLATFORM = getPlatform();
export const PLATFORM_VERSION = os.release();
export const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const LOCALE = osLocale.sync().replace('_', '-');
const tuple = LOCALE.split('-');
export const COUNTRY = (tuple.length === 2) ? tuple[1] : '??';

function getPlatform(): string {
    const platform: string = os.platform();
    if (platform.startsWith('win')) {
        return 'Windows';
    }
    if (platform.startsWith('darwin')) {
        return 'Mac';
    }
    return 'Linux';
}