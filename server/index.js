// Entrypoint wrapper: arranca el servidor definido en server/server.js
try {
  require('./server.js');
} catch (err) {
  console.error('Error arrancando el servidor desde server/index.js:', err.message);
  process.exit(1);
}
