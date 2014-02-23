INPUT_TIMEOUT = 7; // in seconds
DUCK_SPEED = 0.5; // in seconds

BOARD_HEIGHT = 20;
BOARD_WIDTH = 60;
TILE_WIDTH = 20; // TODO don't hardcode
TILE_HEIGHT = 20; // TODO don't hardcode
PREBOARD_WIDTH = 9;
DUCK_START_POSITION = { x: parseInt(PREBOARD_WIDTH / 2, 10), y: parseInt(BOARD_HEIGHT / 2, 10) };

function BoardCtrl($scope, $timeout, $interval) {
  $scope.apple_difficulty = 5;

  $scope.init = function () {
    $scope.duck_position = DUCK_START_POSITION;
    $scope.directions = [];
    $scope.move_count = 0;
    $scope.pre_countdown = 3;
    $scope.alive = true;
    $scope.apple_difficulty = 5;

    $scope.scroll_left = 0;

    // Draw duck
    $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 'duck');

    $scope.pan_board();
  };

  $scope.generateBoard = function () {
    for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
      var arr = [];
      for ( var j = 0; j < window.BOARD_WIDTH; j++ ) {
        arr.push(0);
      }
      $scope.board.push(arr);
    }
  };

  // Make a board
  $scope.newBoard = function () {
    $scope.board = [];
    $scope.generateBoard();
    $scope.board = generatePath($scope.board);
    $scope.board = generatePath($scope.board);

    // Draw apples
    var column = 0;
    while (PREBOARD_WIDTH + column < window.BOARD_WIDTH ) {
      column = column + $scope.apple_difficulty;
      $scope.apple_difficulty++;
      $scope.board = generateAdders($scope.board, PREBOARD_WIDTH + column);
    }
    $scope.board = generatePreboard($scope.board);

    $scope.init();

  };

  $scope.pan_board = function () {
    var left = BOARD_WIDTH * TILE_WIDTH;
    var outer = document.querySelector(".board-outer-container");

    var scroll_interval = $interval(function () {
      left = left - 5;
      outer.scrollLeft = left;

      if ( left <= 0 ) {
        $interval.cancel(scroll_interval);

        $scope.pre_countdown = 3;
        var countdown_interval = $interval(function () {
          $scope.pre_countdown--;
          if ( $scope.pre_countdown === 0 ) {
            $interval.cancel(countdown_interval);
            // Let them input!
            $scope.inputDirections();
          }
        }, 1000);

      }
    }, 10);

  };

  $scope.newBoard();

  $scope.restart = function () {
    $scope.init();
    //$scope.shiftViewport();
  };


  $scope.shiftViewport = function () {
    var outer = document.querySelector(".board-outer-container");
    var left = Math.max( ( $scope.duck_position.x - 3 ) * TILE_WIDTH, 0);
    outer.scrollLeft = left;
  };

  // TODO Consolidate these
  $scope.placeDuck = function (position) {

    // Remove old duck
    var old_tile = $scope.board[$scope.duck_position.x][$scope.duck_position.y];
    $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, old_tile);

    $scope.duck_position = position;

    // Shift the viewport
    $scope.shiftViewport();

    $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 'duck');
  };

  $scope.moveDuck = function () {

    // Remove old duck
    //var old_tile = $scope.board[$scope.duck_position.x][$scope.duck_position.y];
    //console.log(old_tile);
    $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 1);

    // Find new position based off their input
    var next_direction = $scope.directions[$scope.move_count];
    if ( next_direction === 4 && $scope.duck_position.x <= window.PREBOARD_WIDTH ) {
      console.log("Can't move into grass");
    } else {
      $scope.duck_position = positionFromDirection($scope.duck_position, next_direction);
    }

    // Shift the viewport
    $scope.shiftViewport();

    // Check if we hit a wall or something
    var status = checkPosition($scope.board, $scope.duck_position);

    // Update board
    $scope.board = changeBoardAtPosition($scope.board, $scope.duck_position, 'duck');

    if ( status === "collision" ) {
      $scope.alive = false;
    } else if ( status === "win" ) {
      alert("You've won!");
    } else if ( status === "apple" ) {

      // TODO ABSTRACT DIS
      $scope.directions = [];
      $scope.move_count = 0;
      $scope.pre_countdown = 3;

      var countdown_interval = $interval(function () {
        $scope.pre_countdown--;
        if ( $scope.pre_countdown === 0 ) {
          $interval.cancel(countdown_interval);
          // Let them input!
          $scope.inputDirections();
        }
      }, 1000);

    } else {

      // if we are at the end, stop trying to move duck
      if ( $scope.move_count === $scope.directions.length ) {
        $scope.alive = false;
      } else { // Otherwise, move the duck again
        $scope.duck_mover = $timeout($scope.moveDuck, DUCK_SPEED * 1000);
        $scope.move_count++;
      }
    }

  };

  // For keyboard
  $scope.input_listener = function (e) {
    $scope.$apply(function () {
      $scope.directions.push({ 38: 0, 39: 1, 40: 2, 37: 3 }[e.which]);
    });
  };

  // For on-screen buttons
  $scope.input = function (dir) {
    $scope.directions.push({ up: 0, right: 1, down: 2, left: 3 }[dir]);
  };

  $scope.inputDirections = function () {
    document.addEventListener("keyup", $scope.input_listener);
    $scope.countdown = INPUT_TIMEOUT;

    $scope.input_interval = $interval(function () {
      if ( $scope.countdown <= 0 ) {
        // Unbind the listener
        document.removeEventListener("keyup", $scope.input_listener);

        // cancel interval
        $interval.cancel($scope.input_interval);

        // First time moving duck? get it out of preboard
        if ( $scope.duck_position.x <= 10 ) {
          $scope.doneInputtingDirections();
        } else { // recently got an apple and inputted dirs
          // Start moving!
          $scope.moveDuck();
        }

      } else {
        $scope.countdown--;
      }
    }, 1000);
  };

  $scope.doneInputtingDirections = function () {
    var countdown = 5;
    var interval = $interval(function () {
      if ( countdown <= 0 ) {
        $interval.cancel(interval);

        $scope.board = generatePreboard($scope.board); // TODO FIX ME

        // Start moving!
        $scope.moveDuck();
        return;
      }

      // move duck 1 square forward
      position = { x: $scope.duck_position.x + 1, y: $scope.duck_position.y };
      $scope.placeDuck(position);

      countdown--;
    }, 500);
  };

  $scope.tweetScore = function () {
    alert("OK TWEETED THX");
  };

}

function randomDirection(position) {
  var x = 1;
  if ( position.y < window.BOARD_HEIGHT / 5 ) {
    x = 2;
  } else if ( position.y > window.BOARD_HEIGHT / 5 ) {
    x = 0;
  }

  var move = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: x, }[_.random(0, 10)];

  // TODO BROKEN
  if ( window.move ) {
    if (   move === 0 && last_move === 2 ||
        move === 2 && last_move === 0 ||
        move === 1 && last_move === 3 ||
        move === 3 && last_move === 1 ) {
          return randomDirection(position);
        }
  }

  window.last_move = move;
  return move;
}

function generatePreboard(board) {
  var new_board = board.slice(0);
  var position = { x: 0, y: 0 };

    for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
      var arr = [];
      for ( var j = 0; j < window.PREBOARD_WIDTH; j++ ) {
        new_board = changeBoardAtPosition(new_board, { x: j, y: i}, 4);
      }
    }


  return new_board;
}

function generateAdders(board, column) {
  var new_board = board.slice(0);

  var i = 0;
  while ( true ) {

    i++;
    if ( i > 200 ) {
      console.log("OMG"); // TODO WTF
      return new_board;
    }

    var row = _.random(0, BOARD_HEIGHT-1);

    if ( new_board[row][column] === 1 ) {
      new_board[row][column] = "apple";
      return new_board;
    }

  }

}

function generatePath(board) {
  var new_board = board.slice(0);
  var position = { x: window.PREBOARD_WIDTH, y: 10 };
  new_board = changeBoardAtPosition(new_board, position, 1);

  while ( position.x < BOARD_WIDTH - 1 ) {
    var next_dir = randomDirection(position);
    position = positionFromDirection(position, next_dir);
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
  if ( direction === 3 && position.x >= 10 ) { return { x: position.x - 1, y: position.y }; } // Left
  return position; // Don't move
}

function checkPosition(board, position) {
  var tile = board[position.y][position.x];

  if ( tile === 0 ) { return "collision"; }
  if ( tile === 'apple' ) { return "apple"; }
  if ( position.x >= BOARD_WIDTH ) { return "win"; }
  return true;
}
