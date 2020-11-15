var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var prompt =  require('prompt');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    let score = 0;
    let r;
    let counter;
    let userFailed = 1;
    let timer;
    let waitingForInput = true;
    startGame();
    socket.on('input', (msg) => {
        if(!waitingForInput) {
            clearTimeout(timer);
            if (r == msg) {
                score++;
            } else {
                score--;
            }
            socket.emit('score', score);
            if (score == 10) {
                socket.emit('won', 'you won');
                endGame();
            } else if (score == -3) {
                socket.emit('lost', 'you lost');
                endGame();
            } else {
                startGame();
            }
        }
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    function endGame() {
        score = 0;
        counter = 0;
        socket.emit('message', 'Refresh to restart the game');
    }

    function startGame() {
        socket.emit('counter','... waiting for server input');
        waitingForInput = true;
        prompt.get('key',(err, result)=> {
            if (err) { return onErr(err); }
            r = result.key;
            counter = 10;
            socket.emit('key', r);
            socket.emit('score', score);
            waitingForInput = false;
            resetCounter();
        });
        
    }

    function onErr(err) {
        console.err(err);
        return 1;
    }

    function resetCounter() {
        timer = setInterval(() => {
            if (counter > 0) {
                socket.emit('counter', counter--);
            } else {
                clear();
            }
        }, 1000);
    }

    function clear() {
        clearTimeout(timer);
        if( userFailed < 3) {
            userFailed++;
            startGame();
        } else {
            socket.emit('lost', 'you lost');
            endGame();
        }
    }
});

http.listen(3000, () => {
    console.log('app listening on *:3000');
});