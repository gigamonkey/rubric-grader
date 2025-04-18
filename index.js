#!/usr/bin/env node

import YAML from 'yaml';
import express from 'express';
import fs from 'fs/promises';
import nunjucks from 'nunjucks';
import os from 'os';
import path from 'path';
import process from 'process';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { openDB } from './db.js';
import { loadRubric } from './data.js'
import { tsv } from './express-tsv.js';

const mod = (a, b) => ((a % b) + b) % b

const dir = process.argv[2];

console.log(`Grading directory ${dir}`);

const db = openDB(path.join(dir, 'db.db'));
const rubricFile = path.join(dir, 'rubric.yml')
const assignment = YAML.parse(await fs.readFile(path.join(dir, 'assignment.yml'), 'utf8'));

const port = process.env.HTTP_PORT ?? 0;
const app = express();

const openUrl = (url) => {
  const platform = os.platform();

  const command = (
    platform === 'win32' ? `start ${url}` :
    platform === 'darwin' ? `open ${url}` :
    `xdg-open ${url}`
  );

  exec(command, (error) => {
    if (error) {
      console.error(`Failed to open URL: ${error}`);
      return;
    }
  });
};

app.set('json spaces', 2);
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, 'public')));
app.use(tsv);

const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
});

/*
 * Latest submissions, one per github handle. Also we reload the rubric each
 * time so we can edit the yaml file and refresh without restarting the server.
 */
app.get('/a/submissions', (req, res) => {
  loadRubric(db, rubricFile);
  res.json(db.latestSubmissions());
});

/*
 * All submissions (multiple per student)
 */
app.get('/a/all-submissions', (req, res) => {
  res.json(db.allSubmissions());
});

/*
 * One fully hydrated submission with answers and scores.
 */
app.get('/a/submission/:sha', (req, res) => {
  const { sha } = req.params;
  res.json({
    ...db.getSubmission({sha}),
    answers: JSON.parse(db.getAnswers({sha}).value),
    scores: JSON.parse(db.getScores({sha}).value),
    comments: JSON.parse(db.getComments({sha}).value),
    stats: db.gradeStats({sha}),
  });
});

/*
 * Update score for one rubric item for one submission.
 */
app.put('/a/scores/:sha', (req, res) => {
  const { sha } = req.params;
  const { question, criteria, correct } = req.body;
  if (correct) {
    db.updateScore({sha, question, criteria, correct });
  } else {
    db.deleteScore({sha, question, criteria });
  }
  res.json(db.gradeStats({sha}));
});

/*
 * Update or delete per-question comment.
 */
app.put('/a/comment/:sha', (req, res) => {
  const { sha } = req.params;
  const { question, comment } = req.body;
  if (comment) {
    db.updateComment({sha, question, comment });
  } else {
    db.deleteComment({sha, question });
  }
  res.send('ok');
});

/*
 * TSV to make into the work file for this assignment.
 */
app.get('/work', (req, res) => {
  res.tsv(db.work().map(({date, github, grade}) =>
    [
      date,
      assignment.kind,
      assignment.name,
      assignment.standard,
      github,
      assignment.weight,
      grade
    ]
  ));
});

app.listen(port, function () {
  const url = `http://localhost:${this.address().port}`;
  console.log(`Opening ${url}`);
  openUrl(url);
})
