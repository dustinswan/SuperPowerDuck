// TIMES
INPUT_TIMEOUT = 4000;
DUCK_SPEED = 500;

BOARD_HEIGHT = 20;
BOARD_WIDTH = 60;
DUCK = 2;
LEFT_KEY = 37;
UP_KEY = 38;
RIGHT_KEY = 39;
DOWN_KEY = 40;
START_POSITION = { x: 0, y: 10 };


function BoardCtrl($scope, $timeout) {
    $scope.board = [];
    $scope.duck_position = START_POSITION;
    $scope.input_timer = "off";

    $scope.generateBoard = function () {
        for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
            var arr = [];
            for ( var j = 0; j < window.BOARD_WIDTH; j++ ) {
                arr.push(0);
            }
            $scope.board.push(arr);
        }
    }

    $scope.generateBoard();

    $scope.board = generatePath($scope.board);
    $scope.board = generatePath($scope.board);

    $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 2);

    $scope.moveDuck = function () {

        // Remove old duck
        $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 1);

        // Find new position based off their input
        var next_direction = $scope.directions.shift();
        $scope.duck_position = positionFromDirection($scope.duck_position, next_direction);

        // Check if we hit a wall or something
        var status = checkPosition($scope.board, $scope.duck_position);

        if ( status === "collision" ) {
            console.log("collided");

            if ( $scope.duck_mover ) {
                $timeout.cancel($scope.duck_mover);
            }

        } else if ( status === "win" ) {
            alert("You've won!");
        } else {
            // Then update board
            $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 2);

            // Move the duck again!
            $scope.duck_mover = $timeout($scope.moveDuck, DUCK_SPEED);
        }
    };

    inputDirections(function (dirs) {
        $scope.directions = _.clone(dirs);
        $scope.moveDuck();
        $scope.input_timer = "on";
    });
};

function randomDirection(position) {
    if ( position.y < window.BOARD_HEIGHT / 5 ) {
        var x = 2;
    } else if ( position.y > window.BOARD_HEIGHT / 5 ) {
        var x = 0;
    }

    var move = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: 1, 11: x }[_.random(0, 11)];

    // TODO BROKEN
    if ( window.move ) {
        if (   move === 0 && last_move === 2 
            || move === 2 && last_move === 0
            || move === 1 && last_move === 3
            || move === 3 && last_move === 1 ) {
            return randomDirection(position);
        }
    }

    window.last_move = move;
    return move;
}

function generatePath(board) {
    var new_board = board;
    var position = START_POSITION; 

    while ( position.x < window.BOARD_WIDTH - 1 ) {
        var next_dir = randomDirection(position);
        var position = positionFromDirection(position, next_dir);
        new_board = changeBoardAtPosition(new_board, position, 1);
    }

    return new_board;
}

function changeBoardAtPosition(board, position, new_tile) {
    var new_board = _.clone(board);
    new_board[position.y][position.x] = new_tile;
    return board;
}

function inputDirections(callback) {
    var directions = [];

    var listener = function (e) {

        var dir = {
            38: 0,
            39: 1,
            40: 2,
            37: 3
        }[e.which] || null;

        if ( ! _.isNull(dir) ) {
            directions.push(dir);
        }
    };

    document.addEventListener("keyup", listener);

    setTimeout(function () {
        document.removeEventListener("keyup", listener);
        callback(directions);
    }, INPUT_TIMEOUT);
}

function positionFromDirection(position, direction) {
    if ( direction === 0 && position.y !== 0 ) {
        return { x: position.x, y: position.y - 1 };
    }

    if ( direction === 1 ) {
        return { x: position.x + 1, y: position.y };
    }

    if ( direction === 2 && position.y !== window.BOARD_HEIGHT - 1 ) {
        return { x: position.x, y: position.y + 1 };
    }

    if ( direction === 3 && position.x !== 0 ) {
        return { x: position.x - 1, y: position.y };
    }

    return position;
}

function checkPosition(board, position) {
    var tile = board[position.y][position.x];

    if ( tile === 0 ) {
        return "collision";
    }

    if ( position.x >= BOARD_WIDTH ) {
        return "win";
    }

    return true;
}
