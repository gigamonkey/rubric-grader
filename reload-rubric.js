#!/usr/bin/env node

import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';
import { argv } from 'process';

const loadRubric = (db, rubric) => {
  Object.entries(rubric).forEach(([question, items], sequence) => {
    db.insertQuestion({sequence, question});
    Object.entries(items).forEach(([criteria, weight], sequence) => {
      db.insertRubricItem({question, criteria, sequence, weight});
    });
  });
};

const reloadRubric = (db, rubric) => {
  db.clearQuestions();
  db.clearRubric();
  loadRubric(db, rubric);
};

const dir = argv[2];
const db = new DB(path.join(dir, 'db.db'), 'schema.sql');
const rubric = YAML.parse(fs.readFileSync(path.join(dir, 'rubric.yml'), 'utf8'));

reloadRubric(db, rubric);
