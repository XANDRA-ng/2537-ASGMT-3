
const express = require('express');
const session = require('express-session')
const app = express();
const fs = require("fs");
//const mysql = require('mysql');
const { JSDOM } = require('jsdom');

// another potential topic, no time :/
// https://www.npmjs.com/package/express-brute


// static path mappings
app.use('/js', express.static('assets/js'));
app.use('/css', express.static('assets/css'));
app.use('/img', express.static('assets/imgs'));
app.use('/fonts', express.static('assets/fonts'));
app.use('/html', express.static('assets/html'));
app.use('/media', express.static('assets/media'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use(session(
  {
      secret:'extra text that no one will guess',
      name:'wazaSessionID',
      resave: false,
      saveUninitialized: true }));



app.get('/', function (req, res) {
    let doc = fs.readFileSync('./assets/html/index.html', "utf8");

    // let's make a minor change to the page before sending it off ...
    let dom = new JSDOM(doc);
    let $ = require("jquery")(dom.window);
    
    initDB();

    res.set('Server', 'Wazubi Engine');
    res.set('X-Powered-By', 'Wazubi');
    res.send(dom.serialize());

});


// async together with await
async function initDB() {

    const mysql = require('mysql2/promise');
    // Let's build the DB if it doesn't exist
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      multipleStatements: true
    });

    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS test;
        use test;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        email varchar(30),
        password varchar(30),
        PRIMARY KEY (ID));`;

    // Used to wait for a promise to finish ... IOW we are avoiding asynchronous behavior
    // Why? See below!
    await connection.query(createDBAndTables);
    let results = await connection.query("SELECT COUNT(*) FROM user");
    let count = results[0][0]['COUNT(*)'];

    if(count < 1) {
        results = await connection.query("INSERT INTO user (email, password) values ('arron_ferguson@bcit.ca', 'admin')");
        console.log("Added one user record. Test");
    }
    connection.end();
}

app.get('/profile', function(req, res) {

    // check for a session first!
    if(req.session.loggedIn) {

        let templateFile = fs.readFileSync('./assets/templates/newsfeed-template.html', "utf8");
        let templateDOM = new JSDOM(templateFile);
        let $template = require("jquery")(templateDOM.window);

        // put the name in
        $template("#profile_name").html(req.session.email);

        // insert the left column from a different file (or could be a DB or ad network, etc.)
        let content = fs.readFileSync('./assets/templates/content.html', "utf8");
        let contentDOM = new JSDOM(content);
        let $content = require("jquery")(contentDOM.window);
        // Replace!
        $template("#content_placeholder").replaceWith($left("#content"));

        res.set('Server', 'Wazubi Engine');
        res.set('X-Powered-By', 'Wazubi');
        res.send(templateDOM.serialize());

    } else {
        // not logged in - no session!
        res.redirect('/');
    }


});

// Notice that this is a 'POST'
app.post('/authenticate', function(req, res) {
    res.setHeader('Content-Type', 'application/json');

    let results = authenticate(req.body.email, req.body.password,
        function(rows) {
            //console.log(rows.password);
            if(rows == null) {
                // not found
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                // authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.email = rows.email;
                req.session.save(function(err) {
                    // session saved
                })
                // this will only work with non-AJAX calls
                //res.redirect("/profile");
                // have to send a message to the browser and let front-end complete
                // the action
                res.send({ status: "success", msg: "Logged in." });
            }
    });

});


function authenticate(email, pwd, callback) {

    const mysql = require('mysql2');
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'test'
    });

    connection.query(
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function (error, results) {
        if (error) {
            throw error;
        }

        if(results.length > 0) {
            // email and password found
            return callback(results[0]);
        } else {
            // user not found
            return callback(null);
        }

    });

}


app.get('/logout', function(req,res){
    req.session.destroy(function(error){
        if(error) {
            console.log(error);
        }
    });
    res.redirect("/profile");
})


// RUN SERVER
let port = 8000;
app.listen(port, function () {
    console.log('Listening on port ' + port + '!');
})
