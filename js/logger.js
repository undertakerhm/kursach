export const LOG_LEVEL = { DEBUG: 0, INFO: 1, ERROR: 2, NONE: 99 };

export class Logger {
  constructor(level = LOG_LEVEL.DEBUG, bus = null) {
    this.level = level;
    this.bus   = bus;
  }

  _log(levelName, message, meta = {}) {
    const numLevel = LOG_LEVEL[levelName] ?? 0;
    if (numLevel < this.level) return;
    const entry = { time: new Date().toISOString().slice(11, 23), level: levelName, message, ...meta };
    const fn = levelName === 'ERROR' ? console.error : levelName === 'DEBUG' ? console.debug : console.log;
    fn(`[${entry.time}] [${levelName}] ${message}`, meta.args ?? '');
    this.bus?.emit('log:entry', entry);
  }

  info(msg, meta)  { this._log('INFO',  msg, meta); }
  debug(msg, meta) { this._log('DEBUG', msg, meta); }
  error(msg, meta) { this._log('ERROR', msg, meta); }
}

let _logger = null;
export function getLogger(bus) {
  if (!_logger) _logger = new Logger(LOG_LEVEL.DEBUG, bus);
  return _logger;
}

export function log(level = 'INFO', logger = _logger) {
  return function (target, propertyKey, fn) {
    return function (...args) {
      const start = performance.now();
      const shortArgs = args.map(a => typeof a === 'object' ? '[Object]' : String(a).slice(0, 40));
      try {
        const result = fn.apply(this, args);
        const ms = (performance.now() - start).toFixed(2);
        logger?._log(level, `${propertyKey}(${shortArgs.join(', ')})`, {
          result: typeof result === 'object' ? '[Object]' : result, ms,
        });
        return result;
      } catch (err) {
        logger?._log('ERROR', `${propertyKey} threw: ${err.message}`, { args: shortArgs });
        throw err;
      }
    };
  };
}

export function logMethod(obj, methodName, level = 'INFO', logger = _logger) {
  const original = obj[methodName].bind(obj);
  obj[methodName] = log(level, logger)(obj, methodName, original);
}
