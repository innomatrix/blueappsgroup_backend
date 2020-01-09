import { config } from './config';
import * as app from './app';

app.configure(config).initComponents(true).run();

