var Pong = window.Pong || {};

Pong.Game = function (width, height, parent) {
    this.game = new Gene.Game(width, height, parent);

    this.stage = null;

    this.ai = null;
    this.player = null;

    this.ball = null;
    this.ballOnPaddle = false;

    this.line = [];

    this.text = {};
    this.score = {};

    this.paddleSpeed = null;
    this.paddleBound = null;

    this.predict = null;

    this.difficult = [];
    this.impact = 0;

    this.checkCollision = {};

    this.isStart = null;
};

Pong.Game.prototype = {
    boot() {
        this.game.create = this.create.bind(this);
        this.game.update = this.update.bind(this);
        this.game.render = this.render.bind(this);

        this.game.start();
    },

    create: function () {
        var that = this;

        this.game.scale.alignCanvas(true, true);

        this.stage = new Gene.Rect(0, 0, this.game.width, this.game.height, "#000");

        this.ai = new Gene.Rect(10, this.game.height / 2 - 40, 20, 80, "#fff");
        this.player = new Gene.Rect(this.game.width - 30, this.game.height / 2 - 40, 20, 80, "#fff");

        this.ball = new Gene.Rect(40, this.game.height / 2 - 10, 20, 20, "#fff");
        this.ballOnPaddle = true;

        for (var i = 10; i < this.game.height; i += 45) {
            this.line.push(new Gene.Rect(this.game.width / 2 - 10, i, 20, 30, '#ccc'));
        }

        this.text.title = new Gene.Text(this.game.width / 2, this.game.height / 2 - 100, '', 'bold 80px Courier', '#000');
        this.text.ai = new Gene.Text(100, 0, '', 'bold 128px Courier', '#ccc');
        this.text.player = new Gene.Text(this.game.width - 100, 0, '', 'bold 128px Courier', '#ccc');
        this.text.invite = new Gene.Text(this.game.width / 2, this.game.height / 2 + 25, '', 'bold 16px Courier', '#000');
        this.text.win = new Gene.Text(this.game.width / 2, 0, '', 'bold 16px Courier', '#000');

        this.score.ai = 0;
        this.score.player = 0;
        this.score.total = 0;
        this.score.win = 0;
        this.score.lose = 0;

        this.speedMax = 700;
        this.paddleSpeed = 300;
        this.paddleBound = 10;

        this.predict = this.stage.centerY;

        this.difficult = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 103, 106, 109];

        this.checkCollision = { up: false, down: false, left: false, right: false };

        this.isStart = false;

        this.game.canvas.onclick = function () {
            that.startGame();
        };
    },

    update: function (dt) {
        if (!this.isStart) {
            return;
        }

        if (this.score.ai === 8) {
            this.endGame('ai');
        }

        if (this.score.player === 8) {
            this.endGame('player');
        }

        this.onWorldBounds();

        if (this.intersects(this.ai, this.ball) && this.ball.velocityX < 0) {
            this.ballToPaddleReaction(this.ai);
            this.ballToWorldPredictions(this.stage, this.ball);
            this.game.sound.play('ping');
        } else if (this.intersects(this.player, this.ball) && this.ball.velocityX > 0) {
            this.ballToPaddleReaction(this.player);
            this.ballToWorldPredictions(this.stage, this.ball);
            this.game.sound.play('pong');
        }

        this.ballMove(dt);
        this.aiMove(dt);
        this.playerMove();
    },

    onWorldBounds: function () {
        this.checkCollision = { up: false, down: false, left: false, right: false };

        this.ballToWorldDetection();

        if (
            !this.checkCollision.up &&
            !this.checkCollision.down &&
            !this.checkCollision.left &&
            !this.checkCollision.right
        ) {
            return;
        }

        this.ballToWorldReaction();
        this.ballToWorldPredictions(this.stage, this.ball);
    },

    ballToWorldDetection: function () {
        if (this.ball.y < this.stage.y) {
            this.checkCollision.up = true;
        }

        if (this.ball.bottom > this.stage.height) {
            this.checkCollision.down = true;
        }

        if (this.ball.x < this.stage.x) {
            this.checkCollision.left = true;
        }

        if (this.ball.right > this.stage.width) {
            this.checkCollision.right = true;
        }
    },

    ballToWorldReaction: function () {
        if (this.checkCollision.up) {
            this.ball.y = this.stage.y; // overlap
            this.ball.velocityY = -this.ball.velocityY;
        }

        if (this.checkCollision.down) {
            this.ball.y = this.stage.height - this.ball.height;
            this.ball.velocityY = -this.ball.velocityY;
        }

        if (this.checkCollision.left) {
            this.ball.x = this.stage.x;
            this.ball.velocityX = -this.ball.velocityX;
            this.score.player++;
            this.game.sound.play('wall');

            this.impact = 0;
        }

        if (this.checkCollision.right) {
            this.ball.x = this.stage.width - this.ball.width;
            this.ball.velocityX = -this.ball.velocityX;
            this.score.ai++;
            this.game.sound.play('wall');

            this.impact = 0;
        }
    },

    ballToPaddleReaction: function (paddle) {
        this.impact++;

        var diff = 0;
        var force = 10 + this.impact;

        if (this.ball.centerY < paddle.centerY) {
            diff = paddle.centerY - this.ball.centerY;
            this.ball.velocityY = (-force * diff);
        } else if (this.ball.centerY > paddle.centerY) {
            diff = this.ball.centerY - paddle.centerY;
            this.ball.velocityY = (force * diff);
        } else {
            this.ball.velocityY = 2 + Math.random() * force;
        }

        this.ball.velocityX = -this.ball.velocityX;
    },

    ballToWorldPredictions: function (stage, ball) {
        var predict;
        var moveDistanceX = 0;
        var moveDistanceY = 0;

        if (ball.velocityX > 0) {
            moveDistanceX = stage.width - ball.x;
        } else {
            moveDistanceX = ball.x;
        }

        if (ball.velocityY > 0) {
            moveDistanceY = stage.height - ball.y;
        } else {
            moveDistanceY = ball.y;
        }

        var moveDurationX = Math.abs(moveDistanceX / ball.velocityX);
        var moveDurationY = Math.abs(moveDistanceY / ball.velocityY);

        var moveTarget = Math.abs(ball.velocityX * moveDurationY);

        if (moveDistanceX > moveTarget) {
            predict = ball.velocityY > 0 ? (stage.height - this.paddleBound) : this.paddleBound;
        } else {
            predict = ball.y + (ball.velocityY * moveDurationX);
        }

        this.predict = Math.floor(predict + this.aiError());
    },

    intersects: function (body1, body2) {
        if (body1.right <= body2.x) {
            return false;
        }

        if (body1.bottom <= body2.y) {
            return false;
        }

        if (body1.x >= body2.right) {
            return false;
        }

        if (body1.y >= body2.bottom) {
            return false;
        }

        return true;
    },

    updateAiPosition: function (paddle, predictY) {
        var positionY = paddle.y;
        var diff = Math.abs(predictY - paddle.centerY);
        var step = 1;

        if (diff > 100) {
            step = 9;
        } else if (diff > 60) {
            step = 6;
        } else if (diff > 50) {
            step = 5;
        } else if (diff > 40) {
            step = 4;
        } else if (diff > 30) {
            step = 3;
        }

        if (predictY < paddle.centerY) {
            positionY -= step;
        } else if (predictY > paddle.centerY) {
            positionY += step;
        }

        return positionY;
    },

    aiMove: function () {
        var positionY = this.updateAiPosition(this.ai, this.predict);

        this.paddleMove(this.ai, positionY);
        this.ai.setBounds();
    },

    playerMove: function () {
        var positionY = this.game.pointer.y - 0.5 * this.player.height;

        this.paddleMove(this.player, positionY);
        this.player.setBounds();
    },

    paddleMove: function (paddle, positionY) {
        var blockedUp = this.paddleBound;
        var blockedBottom = this.stage.height - paddle.height - this.paddleBound;

        if (positionY < blockedUp) {
            paddle.y = blockedUp;
        } else if (positionY > blockedBottom) {
            paddle.y = blockedBottom;
        } else {
            paddle.y = positionY;
        }
    },

    ballMove: function (dt) {
        this.ball.x += this.ball.velocityX * dt;
        this.ball.y += this.ball.velocityY * dt;

        this.ball.setBounds();
    },

    startGame: function () {
        if (this.isStart) {
            return;
        }

        this.ball.velocityX = -300;
        this.ball.velocityY = -500;

        this.isStart = true;
    },

    endGame: function (key) {
        if (key === 'ai') {
            this.score.lose++;
        }

        if (key === 'player') {
            this.score.win++;
        }

        this.score.total++;

        this.isStart = false;

        this.resetEntities(key);
    },

    aiError: function () {
        var level = 8 + (this.score.player - this.score.ai);

        var min = -this.difficult[level];
        var max = this.difficult[level];

        return min + (Math.random() * (max - min));
    },

    resetEntities: function (key) {
        if (key === 'ai') {
            this.ball.x = this.width - this.player.width - 1.5 * this.ball.width - 10;
            this.ball.y = this.height / 2 - this.ball.height / 2;
        }

        if (key === 'player') {
            this.ball.x = this.player.width + this.ball.width;
            this.ball.y = this.height / 2 - this.ball.height / 2;
        }

        this.ai.y = this.height / 2 - this.ai.height / 2;
        this.player.y = this.height / 2 - this.ai.height / 2;

        this.ball.velocityX = 0;
        this.ball.velocityY = 0;

        this.score.ai = 0;
        this.score.player = 0;
    },

    render: function () {
        var that = this;

        this.game.drawRect(this.stage);

        this.game.drawRect(this.ai);

        this.game.drawRect(this.player);

        this.game.drawRect(this.ball);

        this.line.forEach(function (body) {
           that.game.drawRect(body);
        });

        this.game.drawText(this.text.ai, this.score.ai);

        this.game.drawText(this.text.player, this.score.player);

        if (this.isStart) {
            return;
        }

        this.game.context.globalAlpha = 0.7;

        this.game.drawRect(this.stage, '#ccc');

        this.game.drawText(this.text.win, "WIN: " + this.score.win + " LOSE: " + this.score.lose);

        this.game.drawText(this.text.title, "PONG");

        this.game.drawText(this.text.invite, "-CLICK TO START-");
    }
};

Pong.Game.prototype.constructor = Pong.Game;