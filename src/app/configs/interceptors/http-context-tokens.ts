import { HttpContextToken } from '@angular/common/http';

/**
 * Disables the display of error toasts for this HTTP request.
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
