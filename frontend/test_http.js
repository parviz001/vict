// const server = 'http://localhost:8080/'
// const server = 'https://45.143.93.51/';
// const server = 'http://45.143.93.51/';
// const server = 'localhost:8080/';
const server = 'https://quiz-game.cf/query2/';

async function send_req(req_json) {
    console.log(JSON.stringify(req_json));

    var url = server;

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify(req_json)
    });

    if (response.ok) { // если HTTP-статус в диапазоне 200-299
      // получаем тело ответа (см. про этот метод ниже)
      let res_json = await response.json();
      console.log(res_json);
      return res_json;
    } else {
        // alert("Ошибка HTTP: " + response.status);
        console.log("Ошибка HTTP: " + response.status);
        // alert("Ошибка при подключении к серверу");
        return {status: "failed", error: "connection"};
        // return {"error": "1"};
    }
}

async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
  return hashHex;
}

async function calc_hash(str) {
    /*jshint bitwise:false */
    let salt = "my_salt_4_quiz";
    return digestMessage(String(str) + salt);
}

async function req_add_round(round_json) {
    // calc_hash(pswd);
    let req_json = round_json;
    req_json["type"] = "add_round";
    let res_json = send_req(req_json);
    return res_json;
}

async function req_del_round(round_id) {
    // calc_hash(pswd);
    let req_json = {
      type: "del_round",
      round_id: round_id
    }
    let res_json = send_req(req_json);
    return res_json;
}

async function req_get_round_list(user_nm) {
    let req_json = {
        type: "get_round_list",
        user_nm: user_nm
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_get_question_list(round_id) {
    let req_json = {
        type: "get_question_list",
        round_id: round_id
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_get_rating_table() {
    let req_json = {
        type: "get_rating_table"
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_get_round_user_score(user_id, round_id) {
    let req_json = {
        type: "get_round_user_score",
        user_id: user_id,
        round_id: round_id
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_get_users() {
    let req_json = {
        type: "get_users"
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_add_user(user_nm, pswd) {
    let hash = await calc_hash(pswd);
    let req_json = {
        type: "add_user",
        user_nm: user_nm,
        pswd: hash
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_del_user(user_nm) {
    // calc_hash(pswd);
    let req_json = {
      type: "del_user",
      user_nm: user_nm
    }
    let res_json = send_req(req_json);
    return res_json;
}

async function req_login(user_nm, pswd) {
    let hash = await calc_hash(pswd);
    let req_json = {
        type: "login",
        user_nm: user_nm,
        pswd: hash
    };
    let res_json = send_req(req_json);
    return res_json;
}

async function req_set_score(user_nm, pswd, now_json) {
    // calc_hash(pswd);
    hash = await calc_hash(pswd);
    // let req_json = round_json;
    let req_json = {
        type: "set_score",
        user_nm: user_nm,
        pswd: hash,
        scores: now_json["scores"]
    };
    req_json["type"] = "set_score";
    let res_json = send_req(req_json);
    return res_json;
}


