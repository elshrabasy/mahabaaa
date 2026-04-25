import { statusTone } from '../../lib/helpers';
export function StatusBadge({status}:{status:string}){ return <span className={`badge ${statusTone(status)}`}>{status}</span>; }