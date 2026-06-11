// ⚠️  Remplace YOUR_LOCAL_IP par l'IP de ton PC (ex: 192.168.1.45)
// Lance `ipconfig` dans PowerShell et prends l'adresse IPv4
const DEV_URL = 'http://192.168.1.11:3000';

// URL de production (Railway / Render) — à remplir plus tard
const PROD_URL = 'https://api.ivoirestream.ci';

export const API_URL = __DEV__ ? DEV_URL : PROD_URL;
