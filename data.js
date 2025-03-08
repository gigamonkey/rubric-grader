#!/usr/bin/env node

import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { argv } from 'process';

const { entries, keys } = Object;

const fileText = (f) => fs.readFileSync(f,  { encoding: 'utf8' });

/*
 * Load the rubric from a YAML file. Wipes out existing entries.
 */
const loadRubric = (db, rubricFile) => {
  db.clearQuestions();
  db.clearRubric();
  entries(parseRubric(rubricFile)).forEach(([question, items], sequence) => {
    db.insertQuestion({sequence, question});
    entries(items).forEach(([criteria, weight], sequence) => {
      db.insertRubricItem({question, criteria, sequence, weight});
    });
  });
  db.scoreMissing();
};

/*
 * Load answers from completions.tsv and answer files. The completions file
 * determines what we load; the answer files just provide the data.
 */
const loadSubmissions = (db, answersDir, rubricFile) => {
  const completionsFile = path.join(answersDir, "completions.tsv")
  const completions = parseCompletions(completionsFile);
  const questions = keys(parseRubric(rubricFile));

  completions.forEach(({sha, github, date}) => {
    if (sha) {
      if (!db.getSubmission({sha})) {
        const answers = parseAnswers(path.join(answersDir, github, "answers.json"));
        db.insertSubmission({sha, github, date});
        answers.forEach((answer, i) => {
          const question = questions[i];
          db.insertAnswer({ sha, question, answer });
        });
      } else {
        console.log(`Already have submission ${sha} in database.`);
      }
    }
  });
  db.scoreMissing();
};

const parseRubric = (f) => YAML.parse(fileText(f));

const dumpRubric = (rubric) => {
  return YAML.stringify(rubric);
}

const parseCompletions = (f) => {
  return fileText(f).split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(line => line.split('\t'))
    .map(row => {
      const [ github, assignment, date, sha ] = row;
      return { github, assignment, date, sha };
    });
};

const parseAnswers = (f) => {
  return JSON.parse(fileText(f)).map(a => a?.trim() ?? "");
}

export { loadRubric, loadSubmissions, parseRubric, dumpRubric };
