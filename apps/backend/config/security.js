/**
 * Security Configuration Module
 * 
 * Centralized security headers and CSP configuration.
 */

let helmet
try {
  helmet = require('helmet');
} catch (e) {
  // helmet not installed — provide no-op middleware for local dev
  helmet = () => (req, res, next) => next()
}

// Content Security Policy configuration
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Required for some legacy compatibility
    "'unsafe-eval'",   // Required for some bundlers
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    "https://fonts.googleapis.com",
    "https://cdn.jsdelivr.net",
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  imgSrc: [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "http:",
  ],
  connectSrc: [
    "'self'",
    "https:",
    "wss:",
    "ws:",
  ],
  mediaSrc: ["'self'", "blob:", "https:"],
  objectSrc: ["'none'"], // Disable Flash/objects
  frameSrc: ["'self'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
};

/**
 * Helmet middleware configuration
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: cspDirectives,
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for iframe compatibility
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
};

/**
 * Security middleware factory
 */
function createSecurityMiddleware() {
  return helmet(helmetConfig);
}

/**
 * Development security middleware (less strict)
 */
function createDevSecurityMiddleware() {
  return helmet({
    ...helmetConfig,
    contentSecurityPolicy: false, // Disable CSP in development for easier debugging
  });
}

module.exports = {
  createSecurityMiddleware,
  createDevSecurityMiddleware,
  helmetConfig,
  cspDirectives,
};
