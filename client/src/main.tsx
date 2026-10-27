import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import App from './App';import'./styles.css';
const pagesRouteKey='gh-pages-route';
const savedPagesPath=sessionStorage.getItem(pagesRouteKey);
if(savedPagesPath){sessionStorage.removeItem(pagesRouteKey);const savedUrl=new URL(savedPagesPath,window.location.origin);if(savedUrl.pathname.startsWith(import.meta.env.BASE_URL))window.history.replaceState(null,'',`${savedUrl.pathname}${savedUrl.search}${savedUrl.hash}`);}
const basename=import.meta.env.BASE_URL==='/'?undefined:import.meta.env.BASE_URL.replace(/\/$/,'');
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter basename={basename}><App/></BrowserRouter></React.StrictMode>);
