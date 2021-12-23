
async function show_rounds() {
    let user_nm = document.getElementById('user_nm_rs').value;
    let nowjson = await req_get_round_list(user_nm);
    document.getElementById('round_list').innerHTML = JSON.stringify(nowjson, null, '\t');
}

async function show_questions() {
    let round_id = parseInt(document.getElementById('round_id_1').value);
    let nowjson = await req_get_question_list(round_id);
    document.getElementById('question_list').innerHTML = JSON.stringify(nowjson, null, '\t');
}

async function add_round() {
    let strjson = document.getElementById('round_info').value;
    let nowjson = JSON.parse(strjson);
    console.log(nowjson);
    let res = await req_add_round(nowjson);
    document.getElementById('add_round_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function del_round() {
    let round_id = parseInt(document.getElementById('del_round_id').value);
    let res = await req_del_round(round_id);
    document.getElementById('del_round_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function add_user() {
    let user_nm = document.getElementById('user_nm1').value;
    let pswd1 = document.getElementById('user_passwd1').value;
    let pswd2 = document.getElementById('user_passwd2').value;
    if (pswd1 != pswd2) {
        alert("Пароли не совпадают");
    }
    let res = await req_add_user(user_nm, pswd1);
    document.getElementById('add_user_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function del_user() {
    let user_nm = document.getElementById('del_user_nm').value;
    let res = await req_del_user(user_nm);
    document.getElementById('del_user_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function login() {
    let user_nm = document.getElementById('user_nm2').value;
    let pswd1 = document.getElementById('user_passwd3').value;
    let res = await req_login(user_nm, pswd1);
    document.getElementById('login_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function get_ratings() {
    let res = await req_get_rating_table();
    document.getElementById('rating_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function get_round_user_score() {
    let user_id = parseInt(document.getElementById('user_id_10').value);
    let round_id = parseInt(document.getElementById('round_id_10').value);
    let res = await req_get_round_user_score(user_id, round_id);
    document.getElementById('round_user_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function get_users() {
    let res = await req_get_users();
    document.getElementById('users_res').innerHTML = JSON.stringify(res, null, '\t');
}

async function set_score() {
    let user_nm = document.getElementById('user_nm4').value;
    let pswd = document.getElementById('user_passwd4').value;
    let strjson = document.getElementById('score_info').value;
    let nowjson = JSON.parse(strjson);
    let res = await req_set_score(user_nm, pswd, nowjson);
    document.getElementById('set_score_res').innerHTML = JSON.stringify(res, null, '\t');
}
