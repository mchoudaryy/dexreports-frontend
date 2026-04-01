import { LayoutDashboard, TrendingUp, Navigation, Layers, LineChart, FileSpreadsheet } from "lucide-react";

export const sidebarMenu = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
    path: "/",
  },
  // {
  //   title: "Pools",
  //   icon: <LayoutDashboard size={20} />,
  //   path: "/pool",
  // },
  // {
  //   title: "RWA",
  //   icon: <LayoutDashboard size={20} />,
  //   path: "/rwa",
  // },
  {
    title: "Tollgate Pools",
    icon: <Navigation size={20} />,
    path: "/pool",
  },
  {
    title: "Cross Engine Pools",
    icon: <Layers size={20} />,
    path: "/rwa",
  },
  {
    title: "Market Making",
    icon: <TrendingUp size={20} />,
    externalUrl: "https://dexmm.stringonchain.io",
  },
  {
    title: "Idlemine Stats",
    icon: <LineChart size={20} />,
    externalUrl: "https://stats.idlemine.io/",
  },
  {
    title: "Audit Export",
    icon: <FileSpreadsheet size={20} />,
    path: "/audit-export",
  },
];
