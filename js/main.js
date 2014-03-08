STATUS_BAR_HEIGHT = 20;
INPUT_TIMEOUT = 7; // in seconds
DUCK_SPEED = 0.5; // in seconds
TILE_WIDTH = 25; // TODO don't hardcode
TILE_HEIGHT = 25; // TODO don't hardcode
BOARD_HEIGHT = parseInt((window.innerHeight - STATUS_BAR_HEIGHT) / TILE_HEIGHT, 10);
BOARD_STARTING_WIDTH = 38;
DUCK_START_POSITION = { x: 0, y: parseInt(BOARD_HEIGHT / 2, 10) };

var DuckApp = angular.module('DuckApp', []);

DuckApp.directive('ngTap', function() {
  return function(scope, element, attrs) {
    var tapping;
    tapping = false;
    element.bind('touchstart', function(e) {
      element.addClass('active');
      tapping = true;
    });
    element.bind('touchmove', function(e) {
      element.removeClass('active');
      tapping = false;
    });
    element.bind('touchend', function(e) {
      element.removeClass('active');
      if (tapping) {
        scope.$apply(attrs.ngTap, element);
      }
    });
  };
});

function board(func) {
  var el = document.getElementById("container");
  if ( _.isFunction(func) ) {
    angular.element(el).scope().$apply(func);
    return;
  }
  return angular.element(el).scope().board;
}

DuckApp.controller('BoardCtrl', function($scope, $timeout, $interval) {

  $scope.init = function () {
    $scope.duck_position = DUCK_START_POSITION;
    $scope.directions = [];
    $scope.move_count = 0;
    $scope.pre_countdown = 4;
    $scope.alive = true;

    $scope.scroll_left = 0;

    // Draw duck
    $scope.board = addToPosition($scope.board, $scope.duck_position, 'duck');

    $timeout($scope.pan_board, 2000);
  };

  $scope.generateBoard = function () {
    for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
      var arr = [];
      for ( var j = 0; j < window.BOARD_STARTING_WIDTH; j++ ) {
        arr.push([]);
      }
      $scope.board.push(arr);
    }
  };

  // Make a board
  $scope.newBoard = function () {
    $scope.board = [];
    $scope.generateBoard();
    $scope.board = generatePath($scope.board, null, "path1");
    $scope.board = generatePath($scope.board, null, "path2");

    // Draw apples
    var column = 0;
    while (true) { // TODO make pretty
      column = column + _.random(4, 6);
      if ( column >= boardWidth() ) { break; }
      var path = path === "path1" ? "path2" : "path1";
      $scope.board = generateAdders($scope.board, column, path);
    }
    window.last_apple_column = column;

    $scope.init();

  };

  $scope.pan_board = function (start_left) {
    var max = boardWidth() * TILE_WIDTH;
    var outer = document.querySelector(".board-outer-container");
    start_left = start_left || 0;
    var left = start_left;

    outer.scrollLeft = start_left;

    $scope.pre_countdown = 4;
    var countdown_interval = $interval(function () {
      $scope.pre_countdown--;
      if ( $scope.pre_countdown === 0 ) {
        $interval.cancel(countdown_interval);
        // Let them input!
        $scope.inputDirections();
      }
    }, 1000);

  };

  $scope.newBoard();

  $scope.restart = function () {
    $scope.init();
  };


  $scope.shiftViewport = function () {
    var outer = document.querySelector(".board-outer-container");
    var left = Math.max( ( $scope.duck_position.x - 3 ) * TILE_WIDTH, 0);
    outer.scrollLeft = left;
  };

  // TODO Consolidate these
  $scope.placeDuck = function (position) {

    // Remove old duck
    $scope.board = removeFromPosition($scope.board, $scope.duck_position, 'duck');

    $scope.duck_position = position;

    // Shift the viewport
    $scope.shiftViewport();

    $scope.board = addToPosition($scope.board, $scope.duck_position, 'duck');
  };

  $scope.moveDuck = function () {

    // Remove old duck
    //var old_tile = $scope.board[$scope.duck_position.x][$scope.duck_position.y];
    $scope.board = removeFromPosition($scope.board, $scope.duck_position, 'duck');

    // Find new position based off their input
    var next_direction = $scope.directions[$scope.move_count];
    if ( next_direction === 4 && $scope.duck_position.x <= 0 ) {
      console.log("Can't move into grass");
    } else {
      $scope.duck_position = positionFromDirection($scope.duck_position, next_direction);
    }

    // Shift the viewport
    $scope.shiftViewport();

    // Check if we hit a wall or something
    var status = checkPosition($scope.board, $scope.duck_position);

    // Update board
    $scope.board = addToPosition($scope.board, $scope.duck_position, 'duck');

    // Add CSS class to animate duck
    //$scope.next_next_direction = $scope.directions[$scope.move_count + 1];
    //TODO

    if ( status === "collision" ) {
      $scope.alive = false;
    } else if ( status === "win" ) {
      alert("You've won!");
    } else if ( status === "apple" ) {

      // TODO ABSTRACT DIS
      $scope.directions = [];
      $scope.move_count = 0;

      // Add more board
      $scope.addMoreBoard();

      // pan to end, then pan back to duck
      var left = ($scope.duck_position.x - 3) * TILE_WIDTH;
      $scope.pan_board(left); // This starts the input thing

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

          $scope.moveDuck();

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

        //$scope.board = generatePreboard($scope.board); // TODO FIX ME

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

  $scope.addMoreBoard = function () {
    var column = boardWidth() - 1;

    var highest, lowest;
    var things;

    // find path1
    for (i = 0; i < window.BOARD_HEIGHT; i++ ) {
      things = $scope.board[i][column];
      if ( _.contains(things, 'path1') || _.contains(things, 'path2') ) {
        highest = i;
        break;
      }
    }

    // find path2
    for (i = window.BOARD_HEIGHT-1; i >= 0; i--) {
      things = $scope.board[i][column];
      if ( _.contains(things, 'path1') || _.contains(things, 'path2') ) {
        lowest = i;
        break;
      }
    }

    $scope.increaseBoardWidth(8);

    $scope.board = generatePath($scope.board, { x: column, y: lowest }, 'path1');
    $scope.board = generatePath($scope.board, { x: column, y: highest }, 'path2');

    // TODO abstract
    // Draw more apples
    column = window.last_apple_column;
    while (true) {
      column = column + _.random(4, 6);
      var path = path === "path1" ? "path2" : "path1";
      $scope.board = generateAdders($scope.board, column, path);
      if ( column >= boardWidth() ) { break; }
    }
    window.last_apple_column = column;

  };

  $scope.increaseBoardWidth = function (count) {
    for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
      for ( var j = 0; j < count; j++ ) {
        $scope.board[i].push([]);
      }
    }

    var new_width_pixels = boardWidth() * TILE_WIDTH;
    var inner = document.querySelector(".board-inner-container");
    inner.style.width = new_width_pixels + "px";
  };

  $scope.tileClasses = function (things) {
    var classes = "";
    if ( _.contains(things, "duck") ) {
      classes += "duck ";
    }
    if ( _.contains(things, "path1") || _.contains(things, "path2") ) {
      classes += "water ";
    }
    if ( _.contains(things, "apple") ) {
      classes += "apple ";
    }
    if ( _.isEmpty(things) ) {
      classes += "blocked";
    }
    return classes;
  };

});

function randomDirection(position) {
  var x = 1;
  if ( position.y < window.BOARD_HEIGHT / 5 ) {
    x = 2;
  } else if ( position.y > window.BOARD_HEIGHT / 5 ) {
    x = 0;
  }

  var move = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: x, }[_.random(0, 10)];

  // TODO BROKEN
  if ( window.last_move ) {
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

function generateAdders(board, column, tile) {
  var new_board = board.slice(0);

  var i = 0;
  while ( true ) {

    if ( i > 100 ) {
      console.log("WTF");
      return new_board;
    }

    i++;
    var row = _.random(0, window.BOARD_HEIGHT-1);

    var things = new_board[row][column];
    if ( _.contains(things, tile) ) {
      return addToPosition(new_board, { x: column, y: row }, "apple");
    }

  }

}

function generatePath(board, position, tile) {
  var new_board = board.slice(0);
  if ( ! position ) {
    position = { x: 0, y: parseInt(BOARD_HEIGHT / 2, 10) };
  }
  new_board = addToPosition(new_board, position, tile);

  while ( position.x < boardWidth() - 1 ) {
    var next_dir = randomDirection(position);
    position = positionFromDirection(position, next_dir);
    new_board = addToPosition(new_board, position, tile);
  }

  return new_board;
}

function removeFromPosition(board, position, thing) {
  var new_board = board.slice(0);
  new_board[position.y][position.x] = _.without(new_board[position.y][position.x], thing);
  return new_board;
}

function addToPosition(board, position, thing) {
  var new_board = board.slice(0);
  var things = new_board[position.y][position.x];
  things.push(thing);
  new_board[position.y][position.x] = _.uniq(things);
  return new_board;
}

function positionFromDirection(position, direction) {
  if ( direction === 0 && position.y !== 0 ) { return { x: position.x, y: position.y - 1 }; } // Up
  if ( direction === 1 ) { return { x: position.x + 1, y: position.y }; } // Right
  if ( direction === 2 && position.y !== window.BOARD_HEIGHT - 1 ) { return { x: position.x, y: position.y + 1 }; } // Down
  if ( direction === 3 && position.x > 0 ) { return { x: position.x - 1, y: position.y }; } // Left
  return position; // Don't move
}

function checkPosition(board, position) {
  var things = board[position.y][position.x];

  if ( ! _.contains(things, "path1") && ! _.contains(things, "path2") ) { return "collision"; }
  if ( _.contains(things, "apple") ) { return "apple"; }
  return true;
}

function isPhonegap() {
  return typeof cordova !== 'undefined' || typeof PhoneGap !== 'undefined' || typeof phonegap !== 'undefined';
}

function isIOS() {
  return navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
}

function boardWidth() {
  return board()[0].length;
}
