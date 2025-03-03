#!/usr/bin/env node

import path from 'path';
import { DB } from './db.js';
import { argv } from 'process';
import { loadRubric, loadSubmissions } from './data.js';

const dir = argv[2];

const db              = new DB(path.join(dir, 'db.db'), 'schema.sql');
const rubricFile      = path.join(dir, 'rubric.yml');
const completionsFile = path.join(dir, "completions.tsv")

loadRubric(db, rubricFile);
loadSubmissions(db, completionsFile, rubricFile)
