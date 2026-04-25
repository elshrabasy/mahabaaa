import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import type { CatalogItem, CompanyProfile, DashboardStats, DocumentRecord, InventoryItem, InventoryMovement, ProductionOrder, Shipment, TemplateRecord, User } from '../../types/entities';

interface AppState{
  currentUser:User|null;
  companyProfile:CompanyProfile|null;
  shipments:Shipment[];
  inventory:InventoryItem[];
  inventoryMovements:InventoryMovement[];
  productionOrders:ProductionOrder[];
  documents:DocumentRecord[];
  items:CatalogItem[];
  templates:TemplateRecord[];
  stats:DashboardStats|null;
  canEdit:boolean;
  canUseProduction:boolean;
  refreshAll:()=>Promise<void>;
  login:(username:string,password:string)=>boolean;
  loginAs:(username:string)=>void;
  logout:()=>void;
}

const AppContext=createContext<AppState|null>(null);
const SESSION_KEY='mahabat-alfan-current-user';

const demoUsers:User[]=[
  {id:'u-admin',name:'Mahabat Alfan Admin',username:'admin',role:'Admin'},
  {id:'u-employee',name:'Production Employee',username:'employee',role:'Employee'},
  {id:'u-viewer',name:'Viewer User',username:'viewer',role:'Viewer'} as User
];

function userFromUsername(username:string):User|null{
  const normalized=username.trim().toLowerCase();
  return demoUsers.find((user)=>user.username.toLowerCase()===normalized) ?? null;
}

export function AppProvider({children}:{children:ReactNode}){
  const [currentUser,setCurrentUser]=useState<User|null>(()=>{
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  });
  const [companyProfile,setCompanyProfile]=useState<CompanyProfile|null>(null);
  const [shipments,setShipments]=useState<Shipment[]>([]);
  const [inventory,setInventory]=useState<InventoryItem[]>([]);
  const [inventoryMovements,setInventoryMovements]=useState<InventoryMovement[]>([]);
  const [productionOrders,setProductionOrders]=useState<ProductionOrder[]>([]);
  const [documents,setDocuments]=useState<DocumentRecord[]>([]);
  const [items,setItems]=useState<CatalogItem[]>([]);
  const [templates,setTemplates]=useState<TemplateRecord[]>([]);
  const [stats,setStats]=useState<DashboardStats|null>(null);

  const refreshAll=useCallback(async()=>{
    const [boot,shipmentRows,inventoryRows,movementRows,orderRows,documentRows,itemRows,templateRows,dashboardStats]=await Promise.all([
      api.bootstrap(),api.getShipments(),api.getInventory(),api.getInventoryMovements(),api.getProductionOrders(),api.getDocuments(),api.getItems(),api.getTemplates(),api.getDashboardStats()
    ]);
    setCurrentUser((prev)=>prev ?? JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') ?? boot.currentUser ?? null);
    setCompanyProfile(boot.companyProfile);
    setShipments(shipmentRows);
    setInventory(inventoryRows);
    setInventoryMovements(movementRows);
    setProductionOrders(orderRows);
    setDocuments(documentRows);
    setItems(itemRows);
    setTemplates(templateRows);
    setStats(dashboardStats);
  },[]);

  useEffect(()=>{ void refreshAll(); },[refreshAll]);

  const value=useMemo<AppState>(()=>({
    currentUser,companyProfile,shipments,inventory,inventoryMovements,productionOrders,documents,items,templates,stats,
    canEdit:currentUser?.role==='Admin',
    canUseProduction:currentUser?.role==='Admin' || currentUser?.role==='Employee',
    refreshAll,
    login(username:string,password:string){
      if(password !== '123456') return false;
      const user=userFromUsername(username);
      if(!user) return false;
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY,JSON.stringify(user));
      return true;
    },
    loginAs(username:string){
      const user=userFromUsername(username) ?? demoUsers[1];
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY,JSON.stringify(user));
    },
    logout(){
      setCurrentUser(null);
      localStorage.removeItem(SESSION_KEY);
    }
  }),[currentUser,companyProfile,shipments,inventory,inventoryMovements,productionOrders,documents,items,templates,stats,refreshAll]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(){
  const context=useContext(AppContext);
  if(!context) throw new Error('useAppState must be used inside AppProvider');
  return context;
}
