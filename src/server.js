import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import autoLoadRoutes from './routes/index.js';

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(logger);

autoLoadRoutes(app);

app.get('/', (req, res) => {
  res.send('API Running');
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
