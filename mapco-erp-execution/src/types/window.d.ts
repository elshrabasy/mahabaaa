import type { ERPApi } from './api';
declare global { interface Window { mapco: { appName:string; version:string; api?:ERPApi; }; } }
export {};