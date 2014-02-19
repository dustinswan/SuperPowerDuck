INPUT_TIMEOUT = 5; // in seconds
DUCK_SPEED = 500;

BOARD_HEIGHT = 20;
BOARD_WIDTH = 60;
DUCK = 2;
LEFT_KEY = 37;
UP_KEY = 38;
RIGHT_KEY = 39;
DOWN_KEY = 40;
START_POSITION = { x: 0, y: 10 };

function BoardCtrl($scope, $timeout, $interval) {
    $scope.board = [];
    $scope.duck_position = START_POSITION;
    $scope.directions = [];
    $scope.move_count = 0;

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
        var next_direction = $scope.directions[$scope.move_count];
        $scope.duck_position = positionFromDirection($scope.duck_position, next_direction);

        // Check if we hit a wall or something
        var status = checkPosition($scope.board, $scope.duck_position);

        if ( status === "collision" ) {
            console.log("collided");
            $timeout.cancel($scope.duck_mover);
        } else if ( status === "win" ) {
            alert("You've won!");
            $timeout.cancel($scope.duck_mover);
        } else {
            // Then update board
            $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 2);

            // Move the duck again!
            $scope.duck_mover = $timeout($scope.moveDuck, DUCK_SPEED);
            $scope.move_count++;
        }

    };

    $scope.input_listener = function (e) {
        $scope.$apply(function () {
            $scope.directions.push({ 38: 0, 39: 1, 40: 2, 37: 3 }[e.which]);
        });
    };

    $scope.inputDirections = function () {
        document.addEventListener("keyup", $scope.input_listener);
        $scope.countdown = INPUT_TIMEOUT;

        $scope.input_interval = $interval(function () {
            if ( $scope.countdown <= 0 ) {
                // Unbind the listener
                document.removeEventListener("keyup", $scope.input_listener);
                // Start moving!
                $scope.moveDuck();
                // cancel interval
                $interval.cancel($scope.input_interval);
            } else {
                $scope.countdown--;
            }
        }, 1000);
    };

    $scope.displayArrow = function (dir) {
        return {
            0: "&uarr;",
            1: "&rarr;",
            2: "&darr;",
            3: "&larr;"
        }[dir];
    };

    $scope.inputDirections();
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
    var new_board = board.slice(0);
    var position = START_POSITION; 

    while ( position.x < window.BOARD_WIDTH - 1 ) {
        var next_dir = randomDirection(position);
        var position = positionFromDirection(position, next_dir);
        new_board = changeBoardAtPosition(new_board, position, 1);
    }

    return new_board;
}

function changeBoardAtPosition(board, position, new_tile) {
    var new_board = board.slice(0);
    new_board[position.y][position.x] = new_tile;
    return new_board;
}

function positionFromDirection(position, direction) {
    if ( direction === 0 && position.y !== 0 ) { return { x: position.x, y: position.y - 1 }; } // Up
    if ( direction === 1 ) { return { x: position.x + 1, y: position.y }; } // Right
    if ( direction === 2 && position.y !== window.BOARD_HEIGHT - 1 ) { return { x: position.x, y: position.y + 1 }; } // Down
    if ( direction === 3 && position.x !== 0 ) { return { x: position.x - 1, y: position.y }; } // Left
    return position; // Don't move
}

function checkPosition(board, position) {
    var tile = board[position.y][position.x];

    if ( tile === 0 ) { return "collision"; }
    if ( position.x >= BOARD_WIDTH ) { return "win"; }
    return true;
}
