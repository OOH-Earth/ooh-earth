import { handleBiodiversityContext } from './handler.ts';

Deno.serve((req) => handleBiodiversityContext(req));
