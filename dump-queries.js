const run = 'run';
const all = 'all';
const get = 'get';

const sql = {

  clearRubric: {
    action: run,
    sql: `delete from rubric where true`,
  },

  clearSubmissions: {
    action: run,
    sql: `delete from submissions where true`,
  },

  clearAnswers: {
    action: run,
    sql: `delete from answers where true`,
  },

  clearQuestions: {
    action: run,
    sql: `delete from questions where true`,
  },

  insertQuestion: {
    action: run,
    sql: `insert into questions (question, sequence) values ($question, $sequence)`,
  },

  insertRubricItem: {
    action: run,
    sql: `insert into rubric (question, criteria, sequence, weight) values ($question, $criteria, $sequence, $weight)`,
  },

  insertSubmission: {
    action: run,
    sql: `insert into submissions (sha, github, date) values ($sha, $github, $date)`,
  },

  insertAnswer: {
    action: run,
    sql: `insert into answers (sha, question, answer) values ($sha, $question, $answer)`,
  },

  updateScore: {
    action: run,
    sql: `insert into scores (sha, question, criteria, correct)
          values ($sha, $question, $criteria, $correct)
          on conflict (sha, question, criteria)
          do update set correct = $correct`,
  },

  updateComment: {
    action: run,
    sql: `insert into comments (sha, question, comment)
          values ($sha, $question, $comment)
          on conflict (sha, question)
          do update set comment = $comment`,
  },

  deleteScore: {
    action: run,
    sql: `delete from scores where sha = $sha and question = $question and criteria = $criteria`,
  },

  deleteComment: {
    action: run,
    sql: `delete from comments where sha = $sha and question = $question`,
  },

  shas: {
    action: all,
    sql: `select distinct sha from submissions order by sha`,
  },

  getQuestions: {
    action: get,
    sql: `select json_group_array(question) value from questions order by sequence`,
  },

  getRubric: {
    action: get,
    sql: `with criteria as (
            select question, json_group_array(criteria) criteria
            from rubric r
            group by question
            order by r.question, sequence
          )
          select json_group_object(question, json(criteria)) value from criteria`,
  },

  getSubmission: {
    action: get,
    sql: `select sha, github, date from submissions where sha = $sha`,
  },

  allSubmissions: {
    action: all,
    sql: `select
            sha,
            github,
            date,
            sum(case when correct is not null then 1.0 else 0.0 end) / count(sha) done,
            sum(case when correct = 'yes' then weight else 0 end) / sum(weight) grade
          from submissions, rubric
          left join scores using (sha, question, criteria)
          group by sha`,
  },

  getAnswers: {
    action: get,
    sql: `select json_group_object(q.question, coalesce(answer, '')) value
          from questions q
          left join answers a on q.question = a.question and sha = $sha`,
  },

  getScores: {
    action: get,
    sql: `with criteria as (
            select r.question, json_group_object(r.criteria, correct) criteria
            from submissions
            join rubric as r
            left join scores using (sha, question, criteria)
            where sha = $sha
            group by question
          )
          select json_group_object(question, json(criteria)) value from criteria`,
  },

  getComments: {
    action: get,
    sql: `select json_group_object(question, comment) value from comments where sha = $sha`,
  },

  getAllAnswers: {
    action: all,
    sql: `select sha, github, date, json_group_array(answer) as answers
          from submissions
          join answers using (sha)
          join questions using (question)
          group by sha, github, date
          order by sequence`,
  },

  gradeStats: {
    action: get,
    sql: `with per_question as (
            select
              sha,
              question,
              sum(case when correct = 'yes' then weight else 0 end) / (1.0 * sum(weight)) question_score
            from submissions, rubric
            left join scores using (sha, question, criteria)
            group by sha, question
         ),
         percent_done as (
           select
             sha,
             sum(case when correct is not null then 1.0 else 0.0 end) / count(*) done
           from submissions, rubric
           left join scores using (sha, question, criteria)
           group by sha
         )
         select
            sha,
            coalesce(done, 0) done,
            coalesce(sum(question_score) / count(*), 0) grade
          from submissions, rubric
          left join per_question using (sha)
          left join percent_done using (sha)
          where sha = $sha`,
  },

  amountGraded: {
    action: all,
    sql: `select
            sha,
            sum(case when correct is null then 1 else 0 end) ungraded,
            sum(case when correct is not null then 1 else 0 end) graded
          from submissions
          join rubric r
          left join scores using (sha, question, criteria)
          group by sha`,
  },

  answerSimilarity: {
    action: run,
    sql: `create table answer_similarity as select
            a1.sha submission1,
            a2.sha submission2,
            a1.question question,
            similarity(a1.answer, a2.answer) similarity
          from answers a1
          join answers a2 on a1.question = a2.question and a1.sha <> a2.sha`,
  },

  work: {
    action: all,
    sql: `select
            date,
            github,
            fps(sum(case when correct = 'yes' then weight else 0 end) / sum(weight)) grade
          from submissions, rubric
          left join scores using (sha, question, criteria)
          group by sha`,
  },

  scoreMissing: {
    action: run,
    sql: `with missing as (
            select *
            from submissions, questions
            left join answers  using (sha, question)
            where coalesce(answer, '') = ''
          )
          insert into scores
            select sha, question, criteria, 'no'
            from missing
            join rubric using (question)
            where true
          on conflict do nothing`,
  },

};


Object.entries(sql).map(([name, { action, sql }]) => {
  console.log(`\n-- :name ${name} :${action}`);
  console.log(sql);
});
