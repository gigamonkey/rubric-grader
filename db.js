import fs from 'fs';
import path from 'path';
import { DB } from 'pugsql';
import { fileURLToPath } from 'url';
import { fps } from './public/js/scoring.js';
import { similarity } from './lcs.js';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const sim = (a, b) => {
  const pat = /\s+/g;
  return similarity(a.replaceAll(pat, ' '), b.replaceAll(pat, ' ')).aToB;
};

const openDB = (filename, schema) => {
  return new DB(filename, schema)
    .addFunction('fps', fps)
    .addFunction('similarity', sim)
    .addQueries(`${__dirname}/queries.sql`);
};

export { openDB };
