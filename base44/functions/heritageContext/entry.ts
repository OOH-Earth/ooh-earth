import { handleHeritageContext } from './handler.ts';

Deno.serve((req) => handleHeritageContext(req));
