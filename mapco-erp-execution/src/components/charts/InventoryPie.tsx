import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppState } from '../../app/providers/AppProvider';
import { formatCurrency } from '../../lib/helpers';
const colors=['#0f766e','#14b8a6','#f97316','#94a3b8','#0369a1','#7c3aed'];
export function InventoryPie(){ const { inventory } = useAppState(); const grouped=inventory.reduce<Record<string,number>>((acc,item)=>{ acc[item.category]=(acc[item.category] ?? 0)+item.totalValue; return acc; },{}); const data=Object.entries(grouped).map(([name,value])=>({name,value}));
return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} innerRadius={70} outerRadius={100} dataKey="value" nameKey="name" paddingAngle={4}>{data.map((entry,index)=><Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value)=>[`${formatCurrency(Number(value))} SAR`,'القيمة']} /></PieChart></ResponsiveContainer></div>; }
