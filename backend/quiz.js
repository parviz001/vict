//// !pre-run:
// ----------------
// npm install pg
// ----------------


//// !admin info:
// ----------------
// https://ruvds.com/cheap_vps/
// https://my.freenom.com/clientarea.php?action=domaindetails
// pm2 start quiz.js --watch
// ----------------


//// !Database:
// ----------------
// user:       'quiz_user',
// host:       'localhost',
// database:   'quiz',
// password:   'quiz'
// ----------------

process.title = "quiz_node";
// pidof my_node

const Pool = require('pg').Pool;

const pool = new Pool({
    user:       'quiz_user',
    host:       'localhost',
    database:   'quiz_db',
    password:   'quiz',
    port:       5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function get_user_id_by_nm(user_nm) {
    try {
        let queryText = 'SELECT * FROM quiz.user WHERE user_nm = $1';
        let resp = await pool.query(queryText, [user_nm]);
        if (resp.rows.length == 0) {
            return "failed";
        } else {
            return resp.rows[0].user_id;
        }
    } catch {
        console.log("get_user_id_by_nm err");
        console.log(err);
        return "failed";
    }
}

async function get_user_id(user_nm, pswd) {
    try {
        let queryText = 'SELECT * FROM quiz.user WHERE user_nm = $1 AND pswd_hash = $2';
        let resp = await pool.query(queryText, [user_nm, pswd]);
        if (resp.rows.length == 0) {
            return "failed";
        } else {
            return resp.rows[0].user_id;
        }
    } catch {
        console.log("get_user_id err");
        console.log(err);
        return "failed";
    }
}

async function get_round_score(user_id, round_id) {
    try {
        let queryText = 'SELECT * FROM quiz.round_rating_v WHERE user_id = $1 AND round_id = $2';
        let resp = await pool.query(queryText, [user_id, round_id]);
        if (resp.rows.length == 0) {
            return "failed";
        } else {
            return resp.rows[0].sum;
        }
    } catch {
        console.log("get_round_score err");
        console.log(err);
        return "failed";
    }
}

async function get_q_round_id(q_id) {
    
    try {
        let queryText = 'SELECT * FROM quiz.question WHERE question_id = $1';
        let resp = await pool.query(queryText, [q_id]);
        if (resp.rows.length == 0) {
            return "failed";
        } else {
            return resp.rows[0].round_id;
        }
    } catch {
        console.log("get_q_round_id err");
        console.log(err);
        return "failed";
    }
}

async function get_round_list(req_json) {
    let show_user_score = false;
    let user_nm = "";
    if (req_json.hasOwnProperty("user_nm")) {
        show_user_score = true;
        user_nm = req_json["user_nm"];
    }
    let user_id = await get_user_id_by_nm(user_nm);
    if (user_id == "failed") {
        show_user_score = false;
    }
    let res_array = [];
    try {
        let resp = await pool.query("SELECT * FROM quiz.round");
        for (let i = 0; i < resp.rows.length; i++) {
            let nowrow = resp.rows[i];
            let round_score = 0;
            if (show_user_score) {
                round_score = await get_round_score(user_id, nowrow.round_id);
                if (round_score == "failed") {
                    round_score = 0;
                } else {
                    round_score = parseInt(round_score);
                }
            }
            let nowjson = {
                round_id:       nowrow.round_id,
                round_nm:       nowrow.round_nm,
                round_theme:    nowrow.round_theme,
                create_date:    nowrow.create_date,
                round_score:    round_score // may be == "failed"
            };
            res_array.push(nowjson);
        }
        return {
            status: "ok",
            round_list: res_array
        };
    } catch(err) {
        console.log("get_round_list err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        }
    }
    return {
        status: "failed",
        error: "?"
    }
}

async function get_question_list(round_id) {
    let res_array = [];
    try {
        let resp = await pool.query("SELECT * FROM quiz.question WHERE round_id = $1", [round_id]);
        for (let i = 0; i < resp.rows.length; i++) {
            let nowrow = resp.rows[i];
            let nowjson = {
                question_id:    nowrow.question_id,
                question_text:  nowrow.question_text,
                answer_cnt:     nowrow.answer_cnt,
                correct_num:    nowrow.correct_num,
                time_limit:     nowrow.time_limit,
                img_path:       nowrow.img_path
            };
            res_array.push(nowjson);
        }
        return {
            status: "ok",
            question_list: res_array
        };
    } catch (err) {
        console.log("get_question_list err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
    return {
        status: "failed",
        error: "?"
    };
}

async function add_round(round_json) {
    try {
        let queryText = 'INSERT INTO quiz.round(round_nm, round_theme) VALUES($1, $2) RETURNING *';
        let resp = await pool.query(queryText, [round_json["round_nm"], round_json["theme_nm"]]);
        if (resp.rowCount > 0) {
            let round_id = resp.rows[0].round_id;
            for (let i = 0; i < round_json["questions"].length; i++) {
                let nowq = round_json["questions"][i];

                let question_text = nowq.question_text;
                let answer_cnt = nowq.answer_cnt; 
                let correct_num = nowq.correct_num;
                let time_limit = nowq.time_limit;
                let img_path = "";
                if (nowq.hasOwnProperty("img_path")) {
                    img_path = nowq.img_path;
                }

                let queryText2 = 'INSERT INTO quiz.question(question_text, round_id, answer_cnt, correct_num, time_limit, img_path)' +
                                ' VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING';
                let resp2 = await pool.query(queryText2, [question_text, round_id, answer_cnt, correct_num, time_limit, img_path]);
            }

            return {
                status: "ok"
            };
        } else {
            return {
                status: "failed",
                error: "nothing inserted"
            };
        }
    } catch(err) {
        console.log("add_round err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function del_round(round_id) {
    try {
        let queryText = 'DELETE FROM quiz.round WHERE round_id = $1';
        let resp = await pool.query(queryText, [round_id]);
        if (resp.rowCount > 0) {
            return {
                status: "ok"
            };
        } else {
            return {
                status: "failed",
                error: "nothing deleted"
            };
        }
    } catch(err) {
        console.log("del_round err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function add_user(user_nm, hash) {
    try {
        let queryText0 = 'SELECT * FROM quiz.user WHERE user_nm = $1';
        let resp0 = await pool.query(queryText0, [user_nm]);
        if (resp0.rows.length > 0) {
            return {
                status: "failed",
                error: "user exists"
            };
        }

        let queryText1 = 'INSERT INTO quiz.user(user_nm, pswd_hash) VALUES($1, $2) ON CONFLICT DO NOTHING';
        let resp1 = await pool.query(queryText1, [user_nm, hash]);
        if (resp1.rowCount > 0) {
            return {
                status: "ok"
            };
        } else {
            return {
                status: "failed",
                error: "nothing added"
            };
        }
    } catch(err) {
        console.log("add_user err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function del_user(user_nm) {
    try {
        let queryText1 = 'DELETE FROM quiz.user WHERE user_nm = $1';
        let resp1 = await pool.query(queryText1, [user_nm]);
        if (resp1.rowCount > 0) {
            return {
                status: "ok"
            };
        } else {
            return {
                status: "failed",
                error: "nothing deleted"
            };
        }
    } catch(err) {
        console.log("del_user err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function login(user_nm, hash) {
    try {
        let queryText = 'SELECT * FROM quiz.user WHERE user_nm = $1';
        let resp = await pool.query(queryText, [user_nm]);
        if (resp.rows.length > 0) {
            let hash2 = resp.rows[0].pswd_hash;
            if (hash2 == hash) {
                let user_id = resp.rows[0].user_id;
                return {
                    user_id: user_id,
                    status: "ok"
                };
            } else {
                return {
                    status: "failed",
                    error: "wrong_pswd"
                };
            }
        }

        return {
            status: "failed",
            error: "no_user"
        };
    } catch(err) {
        console.log("login err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function get_users() {
    let res_array = [];
    try {
        let resp = await pool.query("SELECT * FROM quiz.user");
        for (let i = 0; i < resp.rows.length; i++) {
            let nowrow = resp.rows[i];
            let nowjson = {
                user_id: nowrow["user_id"],
                user_nm: nowrow["user_nm"]
            };
            res_array.push(nowjson);
        }
        return {
            status: "ok",
            user_list: res_array
        };
    } catch (err) {
        console.log("get_users err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
    return {
        status: "failed",
        error: "?"
    };
}

async function get_rating_table() {
    let res_array = [];
    try {
        let resp = await pool.query("SELECT * FROM quiz.rating_table_v");
        for (let i = 0; i < resp.rows.length; i++) {
            let nowrow = resp.rows[i];
            let nowjson = {
                user_id: nowrow["user_id"],
                user_nm: nowrow["user_nm"],
                rating:  parseInt(nowrow["score_sum"])
            };
            res_array.push(nowjson);
        }
        return {
            status: "ok",
            user_list: res_array
        };
    } catch (err) {
        console.log("get_rating_table err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
    return {
        status: "failed",
        error: "?"
    };
}

async function set_score(req_json) {
    try {
        let user_nm = req_json["user_nm"];
        let pswd = req_json["pswd"];

        let user_id = await get_user_id(user_nm, pswd);

        if (user_id == "failed") {
            return {
                status: "failed",
                error: "login"
            };
        }

        let queryText = 'INSERT INTO quiz.score(user_id, question_id, round_id, score_num) VALUES($1, $2, $3, $4)';
        let scores = req_json["scores"]
        for (let i = 0; i < scores.length; i++) {
            let now_score = scores[i];
            let nowq_id = now_score["question_id"];
            let round_id = await get_q_round_id(nowq_id);
            if (round_id == "failed") {
                return {
                    status: "failed",
                    error: "incorrect question_id"
                };
            }
            let score_num = now_score["score"];
            let resp = await pool.query(queryText, [user_id, nowq_id, round_id, score_num]);
        }
        return {
            status: "ok"
        }
    } catch(err) {
        console.log("add_score err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function get_round_user_score(user_id, round_id) {
    try {
        let queryText = 'SELECT * FROM quiz.score WHERE user_id = $1 AND round_id = $2';
        let resp = await pool.query(queryText, [user_id, round_id]);
        let rows = resp.rows;
        let res = [];
        for (let i = 0; i < rows.length; i++) {
            let nowrow = rows[i];
            let nowjson = {
                question_id: nowrow.question_id,
                score: nowrow.score_num
            };
            res.push(nowjson);
        }
        return {
            score: res
        };
    } catch(err) {
        console.log("get_round_user_score err");
        console.log(err);
        return {
            status: "failed",
            error: "?"
        };
    }
}

async function query(req_json) {
    if (req_json['type'] == 'test_node') {
        let res_json = {
            test: "ok"
        }
        return res_json;
    }

    if (req_json['type'] == 'get_round_list') {
        let res_json = get_round_list(req_json);
        return res_json;
    }

    if (req_json['type'] == 'get_question_list') {
        let res_json = get_question_list(req_json["round_id"]);
        return res_json;
    }

    if (req_json['type'] == 'add_round') {
        let res_json = add_round(req_json);
        return res_json;
    }

    if (req_json['type'] == 'del_round') {
        let res_json = del_round(req_json["round_id"]);
        return res_json;
    }

    if (req_json['type'] == 'add_user') {
        let res_json = add_user(req_json["user_nm"], req_json["pswd"]);
        return res_json;
    }

    if (req_json['type'] == 'del_user') {
        let res_json = del_user(req_json["user_nm"]);
        return res_json;
    }

    if (req_json['type'] == 'get_users') {
        let res_json = get_users();
        return res_json;
    }

    if (req_json['type'] == 'login') {
        let res_json = login(req_json["user_nm"], req_json["pswd"]);
        return res_json;
    }

    if (req_json['type'] == 'get_rating_table') {
        let res_json = get_rating_table();
        return res_json;
    }

    if (req_json['type'] == 'get_round_user_score') {
        let res_json = get_round_user_score(req_json["user_id"], req_json["round_id"]);
        return res_json;
    }

    if (req_json['type'] == 'set_score') {
        let res_json = set_score(req_json);
        return res_json;
    }

    return {status: "failed", error: "type"};
}

/// start
var http = require('http');
var server = http.createServer();
server.on('request', async function(req, res) {
    try {
        if (req.method == "OPTIONS") {
            // Access-Control-Allow-Origin: *
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Max-Age", "1800");
            res.setHeader("Access-Control-Allow-Headers", "content-type");
            res.setHeader("Access-Control-Allow-Methods","PUT, POST, GET, DELETE, PATCH, OPTIONS");

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end();
        }
        if (req.method == "GET") {
            // Access-Control-Allow-Origin: *
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Max-Age", "1800");
            res.setHeader("Access-Control-Allow-Headers", "content-type");
            res.setHeader("Access-Control-Allow-Methods","PUT, POST, GET, DELETE, PATCH, OPTIONS");

            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.write('Hello World! Ready to quiz?\n');
            res.end();
        }
        if (req.method == "POST") {
            console.log ( req.method, req.url );
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            })
            req.on('end', async() => {
                try {
                    let nowjson = await JSON.parse(data);
                    console.log(nowjson);
                    let res_json = await query(nowjson).then((res_json_) => {
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        res.setHeader("Access-Control-Allow-Credentials", "true");
                        res.setHeader("Access-Control-Max-Age", "1800");
                        res.setHeader("Access-Control-Allow-Headers", "content-type");
                        res.setHeader("Access-Control-Allow-Methods","PUT, POST, GET, DELETE, PATCH, OPTIONS");

                        res.writeHead(200, {'Content-Type': 'text/plain'});

                        console.log(res_json_);
                        res.write(JSON.stringify(res_json_));
                        res.end();
                    }).catch(err => {
                        console.log("res_error: " + err);
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        res.setHeader("Access-Control-Allow-Credentials", "true");
                        res.setHeader("Access-Control-Max-Age", "1800");
                        res.setHeader("Access-Control-Allow-Headers", "content-type");
                        res.setHeader("Access-Control-Allow-Methods","PUT, POST, GET, DELETE, PATCH, OPTIONS");

                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.write(JSON.stringify({status: "failed", error: "?"}));
                        res.end();
                    });
                } catch(err) {
                    console.log("I CATCHED: " + err);
                    res.end();
                }
            })
        }
    } catch(err) {
        console.log("I CATCHED: " + err);
        res.end();
    }
});

server.listen(8082, '0.0.0.0');

process.on('uncaughtException', (err, origin) => {
    console.log(err);
});
