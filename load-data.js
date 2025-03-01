#!/usr/bin/env node

import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { DB } from './db.js';
import { argv } from 'process';

const loadRubric = (rubric) => {
  Object.entries(rubric).forEach(([question, items], sequence) => {
    db.insertQuestion({sequence, question});
    Object.entries(items).forEach(([criteria, weight], sequence) => {
      db.insertRubricItem({question, criteria, sequence, weight});
    });
  });
};

const loadSubmissions = (files, questions) => {
  files.forEach(f => {
    const { sha, github, date, answers } = parseSubmission(f);
    db.insertSubmission({sha, github, date});
    answers.forEach((answer, i) => {
      const question = questions[i];
      db.insertAnswer({ sha, question, answer });
    });
  });
  db.scoreMissing();
};

const newLoadSubmissions = (dir, questions) => {
  const comps = loadCompletions(path.join(dir, "completions.tsv"));

  comps.forEach(c => {
    if (c.sha) {
      const answers = loadAnswers(path.join(dir, c.github, "answers.json"));
      db.insertSubmission(c);
      answers.forEach((answer, i) => {
        const question = questions[i];
        db.insertAnswer({ sha: c.sha, question, answer });
      });
    }
  });
  db.scoreMissing();
};

const parseSubmission = (f) => {
  const sha     = fs.readFileSync(path.join(path.dirname(f), "commit.txt"), { encoding: 'utf8' }).trim();
  const github  = path.basename(path.dirname(path.dirname(f)));
  const date    = path.basename(path.dirname(f));
  const answers = JSON.parse(fs.readFileSync(f, { encoding: 'utf8' })).map(a => a?.trim() ?? "");
  return { sha, github, date, answers };
}

const loadCompletions = (f) => {
  const text = fs.readFileSync(f,  { encoding: 'utf8' });

  console.log(text);

  const rows = text.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(row => row.split('\t'))

  return rows.map(row => {
    const [ github, assignment, date, sha ] = row;
    return { github, assignment, date, sha };
  });
};

const loadAnswers = (f) => {
  return JSON.parse(fs.readFileSync(f, { encoding: 'utf8' })).map(a => a?.trim() ?? "");
}

const dir = argv[2];

const db = new DB(path.join(dir, 'db.db'), 'schema.sql');
const rubric = YAML.parse(fs.readFileSync(path.join(dir, 'rubric.yml'), 'utf8'));
//const answerFiles = await glob(path.join(dir, "answers/**/answers.json"), {});

loadRubric(rubric);
//loadSubmissions(answerFiles, Object.keys(rubric));
newLoadSubmissions(dir, Object.keys(rubric));
