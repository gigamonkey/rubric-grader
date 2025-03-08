#!/usr/bin/env node

import path from 'path';
import { DB } from './db.js';
import { argv } from 'process';
import { loadRubric, loadSubmissions } from './data.js';

const here = import.meta.dirname;

const databaseFile = argv[2]

const db = new DB(databaseFile);

db.answerSimilarity();
