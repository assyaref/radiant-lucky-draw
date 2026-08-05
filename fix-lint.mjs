import fs from 'fs';

// Fix 1: SocketService.ts - unused 'error' in catch
const socketPath = 'src/services/socket/SocketService.ts';
let socket = fs.readFileSync(socketPath, 'utf8');
socket = socket.replace(
  '} catch (error) {\n        this.log(`[Socket] Failed to flush message: ${msg.event}`);',
  '} catch {\n        this.log(`[Socket] Failed to flush message: ${msg.event}`);',
);
fs.writeFileSync(socketPath, socket);
console.log('Fixed SocketService.ts');

// Fix 2: sw.ts - remove @ts-nocheck
const swPath = 'src/services/offline/sw.ts';
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace('// @ts-nocheck - This file runs in ServiceWorkerGlobalScope, not Window\n', '');
fs.writeFileSync(swPath, sw);
console.log('Fixed sw.ts');

// Fix 3: SyncStatus.tsx - Date.now purity
const syncPath = 'src/services/offline/components/SyncStatus.tsx';
let sync = fs.readFileSync(syncPath, 'utf8');
sync = sync.replace(
  '  const formatTime = (timestamp: number) => {\n    const diff = Date.now() - timestamp;',
  '  const formatTime = (timestamp: number) => {\n    // eslint-disable-next-line react-hooks/purity -- Date.now used for relative timestamp display\n    const diff = Date.now() - timestamp;',
);
fs.writeFileSync(syncPath, sync);
console.log('Fixed SyncStatus.tsx');

// Fix 4: usePendingActions.ts - setState in effect
const pendingPath = 'src/services/offline/hooks/usePendingActions.ts';
let pending = fs.readFileSync(pendingPath, 'utf8');
pending = pending.replace(
  '  useEffect(() => {\n    refresh();',
  '  useEffect(() => {\n    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load\n    refresh();',
);
fs.writeFileSync(pendingPath, pending);
console.log('Fixed usePendingActions.ts');
