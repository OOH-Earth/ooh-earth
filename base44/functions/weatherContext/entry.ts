import { handleWeatherContext } from './handler.ts';

Deno.serve((req) => handleWeatherContext(req));
