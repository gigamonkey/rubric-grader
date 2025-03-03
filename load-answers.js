#!/usr/bin/env node

import path from 'path';
import { DB } from './db.js';
import { argv } from 'process';
import { loadRubric, loadSubmissions } from './data.js';

const here = import.meta.dirname;

// Where the grading database and rubric file is stored.
const gradingDir = argv[2];

// Where we're loading answers from. This allows us to load multiple versions of
// answers into a single database for grading.
const answersDir = argv[3]

const db = new DB(path.join(gradingDir, 'db.db'), path.join(here, 'schema.sql'));
const rubricFile = path.join(gradingDir, 'rubric.yml');

loadSubmissions(db, answersDir, rubricFile)
