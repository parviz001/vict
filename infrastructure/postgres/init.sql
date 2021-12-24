CREATE TABLE quiz.question (
    question_id integer NOT NULL,
    round_id integer NOT NULL,
    question_text text NOT NULL,
    answer_cnt integer NOT NULL,
    correct_num integer NOT NULL,
    time_limit integer NOT NULL,
    img_path text
);

CREATE TABLE quiz.score (
    score_id integer NOT NULL,
    user_id integer NOT NULL,
    question_id integer NOT NULL,
    round_id integer NOT NULL,
    score_num integer NOT NULL
);

CREATE TABLE quiz."user" (
    user_id integer NOT NULL,
    user_nm text NOT NULL,
    pswd_hash text NOT NULL
);

CREATE VIEW quiz.rating_table_v AS
 SELECT ui.user_nm,
    ur.user_id,
    ur.score_sum
   FROM (( SELECT score.user_id,
            sum(score.score_num) AS score_sum
           FROM quiz.score
          GROUP BY score.user_id) ur
     JOIN quiz."user" ui ON ((ui.user_id = ur.user_id)));


CREATE VIEW quiz.rating_v AS
 SELECT score.user_id,
    sum(score.score_num) AS score_num
   FROM quiz.score
  GROUP BY score.user_id;


CREATE TABLE quiz.round (
    round_id integer NOT NULL,
    round_nm text NOT NULL,
    round_theme text,
    create_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE VIEW quiz.round_rating_v AS
 SELECT score.user_id,
    score.round_id,
    sum(score.score_num) AS sum
   FROM quiz.score
  GROUP BY score.user_id, score.round_id;
