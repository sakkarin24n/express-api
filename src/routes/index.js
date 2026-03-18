import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const autoLoadRoutes = (app) => {
  const routesPath = path.join(__dirname);
  
  fs.readdirSync(routesPath).forEach((file) => {
    if (file.endsWith('.js') && file !== 'index.js') {
      const routeName = file.replace('.js', '');
      const routePath = `/api/${routeName.replace('Routes', '')}`;
      import(`./${file}`).then((route) => {
        app.use(routePath, route.default);
        console.log(`Route loaded: ${routePath}`);
      });
    }
  });
};

export default autoLoadRoutes;
