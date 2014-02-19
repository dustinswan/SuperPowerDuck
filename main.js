window.BOARD_HEIGHT = 20;
window.BOARD_WIDTH = 60;

function BoardCtrl($scope) {
    $scope.board = [];

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
    var current_pos = {x: 0, y: 10};
    var position = { x: 0, y: 10 }; 

    while ( position.x < window.BOARD_WIDTH - 1 ) {
        var next_dir = randomDirection(position);

        if ( next_dir === 0 && position.y !== 0 ) {
            position = { x: position.x, y: position.y - 1 };
        }

        if ( next_dir === 1 ) {
            position = { x: position.x + 1, y: position.y };
        }

        if ( next_dir === 2 && position.y !== window.BOARD_HEIGHT - 1 ) {
            position = { x: position.x, y: position.y + 1 };
        }

        if ( next_dir === 3 && position.x !== 0 ) {
            position = { x: position.x - 1, y: position.y };
        }

        new_board = changeBoardAtPosition(new_board, position, 1);
    }

    return new_board;
}

function changeBoardAtPosition(board, position, new_tile) {
    var new_board = _.clone(board);
    new_board[position.y][position.x] = new_tile;
    return board;
}
