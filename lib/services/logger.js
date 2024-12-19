"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = getLogger;
const winston_1 = __importDefault(require("winston"));
const safe_1 = __importDefault(require("@colors/colors/safe"));
function getLogger(label, minLevel) {
    return winston_1.default.createLogger({
        format: winston_1.default.format.combine(winston_1.default.format.label({ label }), winston_1.default.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }), 
        // Include timestamp on level
        winston_1.default.format((info) => {
            info.level = `[${info.level}]`;
            while (info.level.length < 8) {
                info.level += ' ';
            }
            info.level = `${info.timestamp} ${info.level}`.toUpperCase();
            return info;
        })(), winston_1.default.format.colorize(), winston_1.default.format.printf((info) => `${info.level} ${info.label ? `${info.label} ` : ''}${safe_1.default.grey(info.message || '')}`)),
        // Define level filter from config
        transports: [new winston_1.default.transports.Console({ level: minLevel || 'debug' })],
    });
}
