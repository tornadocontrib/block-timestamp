import { getConfig } from './config';
import { recreateDB } from './services';

recreateDB(getConfig().mongoUrl).then(() => {
    console.log('DB reset complete');
    process.exit();
});
