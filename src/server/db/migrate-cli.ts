import { loadConfig } from '../config.js';
import { initializeDatabase } from './migrate.js';

const database = initializeDatabase(loadConfig());
database.close();
