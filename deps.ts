import { marky } from "https://deno.land/x/marky@v1.1.6/mod.ts";
import Handlebars from "https://unpkg.com/handlebars-esm";
import hljs from "https://unpkg.com/@highlightjs/cdn-assets@11.3.1/es/highlight.js";
import hljsClojure from "https://unpkg.com/@highlightjs/cdn-assets@11.3.1/es/languages/clojure.min.js";
import * as std from "https://deno.land/std@0.114.0/fs/mod.ts";
import * as testing from "https://deno.land/std@0.114.0/testing/asserts.ts";
import * as parsers from "https://deno.land/x/marky@v1.1.6/parsers.ts";
import { createCanvas } from "https://deno.land/x/canvas@v1.3.0/mod.ts";
import canvasTxt from 'https://cdn.skypack.dev/canvas-txt';

export {
  Handlebars,
  hljs,
  hljsClojure,
  marky,
  parsers,
  std,
  testing,
  createCanvas,
  canvasTxt
};
