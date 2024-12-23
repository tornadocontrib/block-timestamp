"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const services_1 = require("./services");
(0, services_1.recreateDB)((0, config_1.getConfig)().mongoUrl).then(() => {
    console.log('DB reset complete');
    process.exit();
});
