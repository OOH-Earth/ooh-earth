import { handleProductLookup } from './handler.ts';

Deno.serve((req) => handleProductLookup(req));
