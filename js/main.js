STATUS_BAR_HEIGHT = 20;
INPUT_TIMEOUT = 7; // in seconds
DUCK_SPEED = 0.4; // in seconds
TILE_WIDTH = 25; // TODO don't hardcode
TILE_HEIGHT = 25; // TODO don't hardcode
//BOARD_HEIGHT = parseInt((window.innerHeight - STATUS_BAR_HEIGHT) / TILE_HEIGHT, 10);
BOARD_HEIGHT = 28;
BOARD_STARTING_WIDTH = 38;
DUCK_START_POSITION = { x: 0, y: parseInt(BOARD_HEIGHT / 2, 10) };

var DuckApp = angular.module('DuckApp', ['ngTouch']);

function board(func) {
  var el = document.getElementById("container");
  if ( _.isFunction(func) ) {
    angular.element(el).scope().$apply(func);
    return;
  }
  return angular.element(el).scope().board;
}

DuckApp.controller('BoardCtrl', function($scope, $timeout, $interval, $http) {

  $scope.apple_difficulty = 0;
  $scope.num_moves = 0;

  drawController();

  // Move the inner container around
  $scope.shiftViewport = function () {
    var inner = document.querySelector(".board-inner-container");
    var left = Math.max( ( $scope.duck_position.x - 3 ) * TILE_WIDTH, 0);
    inner.style.marginLeft = -1 * left + "px";
  };

  $scope.drawMoreApples = function () {
    var column = (window.last_apple_column || 5);// + 5;
    while ( true ) {
      var path = path === "path1" ? "path2" : "path1"; // Switch between paths
      $scope.board = generateAdders($scope.board, column, path);
      var next_skip = _.random(parseInt(4 + $scope.apple_difficulty / 3, 10), parseInt(6 + $scope.apple_difficulty / 3, 10));

      if ( column + next_skip >= boardWidth() ) {
        break;
      }
      column = column + next_skip;

    }

    window.last_apple_column = column;
  };

  $scope.startCountdown = function () {
    $scope.pre_countdown = 3;
    var countdown_interval = $interval(function () {
      $scope.pre_countdown--;
      if ( $scope.pre_countdown === 0 ) {
        $interval.cancel(countdown_interval);

        // Let them input!
        $scope.inputDirections();
      }
    }, 1000);
  };

  $scope.init = function () {
    $scope.duck_position = DUCK_START_POSITION;
    $scope.directions = [];
    $scope.move_count = 0;
    $scope.alive = true;
    $scope.apple_difficulty = 0;
    $scope.num_moves = 0;

    $scope.shiftViewport();

    // Draw duck
    $scope.board = addToPosition($scope.board, $scope.duck_position, 'duck');

    $scope.startCountdown();
  };

  $scope.generateBoard = function () {
    for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
      var arr = [];
      for ( var j = 0; j < window.BOARD_STARTING_WIDTH; j++ ) {
        arr.push(["blocked" + _.random(0,2)]);
      }
      $scope.board.push(arr);
    }
  };

  // Make a board
  $scope.newBoard = function () {
    window.last_apple_column = 0;
    $scope.board = [];
    $scope.generateBoard();

    $scope.board = generatePath($scope.board, null, "path1");
    $scope.board = generatePath($scope.board, null, "path2");

    // Draw apples
    $scope.drawMoreApples();

    $scope.init();

  };

  $scope.newBoard();

  $scope.restart = function () {
    $scope.newBoard();
  };

  $scope.moveDuck = function () {

    // Increase move counetr
    $scope.num_moves++;

    // Remove old duck
    $scope.board = removeFromPosition($scope.board, $scope.duck_position, 'duck');

    // Find new position based off their input
    var next_direction = $scope.directions[$scope.move_count];
    $scope.duck_position = positionFromDirection($scope.duck_position, next_direction);

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
      $scope.calculateScore();

    } else if ( status === "apple" ) {

      // Increase difficulty
      $scope.apple_difficulty++;

      // Remove apple from board
      $scope.board = removeFromPosition($scope.board, $scope.duck_position, 'apple');

      // TODO ABSTRACT DIS
      $scope.directions = [];
      $scope.move_count = 0;

      // Add more board
      $scope.addMoreBoard();

      $scope.startCountdown();

    } else {

      // if we are at the end, stop trying to move duck
      if ( $scope.move_count === $scope.directions.length ) {
        $scope.alive = false;
        $scope.calculateScore();
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

  // TODO clean this up
  var height = window.innerHeight;
  var width = 475;

  var down_triangle_coords = [ { x: 0, y: height }, { x: width, y: height }, { x: width / 2, y: height / 2 } ];
  var up_triangle_coords = [ { x: 0, y: 0 }, { x: width, y: 0 }, { x: width / 2, y: height / 2 } ];
  var left_triangle_coords = [ { x: 0, y: 0 }, { x: 0, y: height }, { x: width / 2, y: height / 2 } ];
  var right_triangle_coords = [ { x: width, y: 0 }, { x: width, y: height }, { x: width / 2, y: height / 2 } ];

  $scope.tap = function (event) {
    var x = event.offsetX || event.changedTouches[0].clientX;
    var y = event.offsetY || event.changedTouches[0].clientY;

    if ( ! $scope.countdown ) { return; }
    if ( isInTriangle({x: x, y: y }, down_triangle_coords[0], down_triangle_coords[1], down_triangle_coords[2]) ) {
      $scope.directions.push(2);
    } else if ( isInTriangle({x: x, y: y }, up_triangle_coords[0], up_triangle_coords[1], up_triangle_coords[2]) ) {
      $scope.directions.push(0);
    } else if ( isInTriangle({x: x, y: y }, left_triangle_coords[0], left_triangle_coords[1], left_triangle_coords[2]) ) {
      $scope.directions.push(3);
    } else if ( isInTriangle({x: x, y: y }, right_triangle_coords[0], right_triangle_coords[1], right_triangle_coords[2]) ) {
      $scope.directions.push(1);
    }

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

  $scope.calculateScore = function () {
    var name = prompt("Enter Your Name", localStorage.previousName || "Duckman");
    $scope.final_score = parseInt(($scope.num_moves / (1 + $scope.apple_difficulty)) * $scope.duck_position.x, 10);
    $scope.submitScore(name, $scope.final_score);
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

    var distance_until_end = boardWidth() - $scope.duck_position.x;
    var distance_to_add = 50 - distance_until_end;

    $scope.increaseBoardWidth(distance_to_add);

    $scope.board = generatePath($scope.board, { x: column, y: lowest }, 'path1');
    $scope.board = generatePath($scope.board, { x: column, y: highest }, 'path2');

    $scope.drawMoreApples();

  };

  $scope.increaseBoardWidth = function (count) {
    for ( var i = 0; i < window.BOARD_HEIGHT; i++ ) {
      for ( var j = 0; j < count; j++ ) {
        $scope.board[i].push(["blocked" + _.random(0,2)]);
      }
    }

    var new_width_pixels = boardWidth() * TILE_WIDTH;
    var inner = document.querySelector(".board-inner-container");
    inner.style.width = new_width_pixels + "px";
  };

  $scope.tileClasses = function (things) { // TODO this gets called every digest. oops
    var classes = "";
    if ( _.contains(things, "duck") ) { classes += "duck "; }
    if ( _.contains(things, "path1") || _.contains(things, "path2") ) { classes += "water "; }
    if ( _.contains(things, "apple") ) { classes += "apple "; }
    if ( _.contains(things, "blocked0") ) { classes += "gray0 "; }
    if ( _.contains(things, "blocked1") ) { classes += "gray1 "; }
    if ( _.contains(things, "blocked2") ) { classes += "gray2 "; }
    if ( _.isEmpty(things) ) { classes += "blocked"; }
    return classes;
  };

  $scope.tileColor = function (tile) {
    if ( _.contains(tile, "path1") || _.contains(tile, "path2") ) {
      return "rgb(0, 0, " + _.random(100, 255) + ")";
    }
  };

  $scope.getScores = function () {
    $http({method: 'GET', url: 'http://dustinswan.org:3000/get_scores'}).
      success(function(data, status, headers, config) {
        $scope.scores = data;
      }).error(function(data, status, headers, config) {
        alert("Error loading scoreboard");
      })
  };

  $scope.submitScore = function (name, score) {
    $http({ method: "GET", url: 'http://dustinswan.org:3000/add_score?score=' + score + '&user=' + name }).
      success(function(data, status, headers, config) {
        $scope.getScores();
      }).error(function(data, status, headers, config) {
        alert("Error adding score");
      })
  };

  $scope.getScores();

});

function randomDirection(position) {
  var x = 1;
  if ( position.y < window.BOARD_HEIGHT / 5 ) {
    x = 2;
  } else if ( position.y > window.BOARD_HEIGHT / 5 ) {
    x = 0;
  }

  var move = { 0: 0, 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 2, 7: 2, 8: 2, 9: 3, 10: x, 11: 1, 12: 1 }[_.random(0, 12)];

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

  while ( true ) {
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

function drawController() {
  return;
   var canvas = document.getElementById('controller_canvas');
   var context = canvas.getContext('2d');

   context.beginPath();
   context.strokeStyle = "#FFFFFF";
   context.lineWidth = 1;

   context.moveTo(0.2, 0.2);
   context.lineTo(canvas.width, canvas.height);

   context.moveTo(canvas.width, 0);
   context.lineTo(0, canvas.height);

   context.stroke();
}

function isInTriangle(p, p1, p2, p3) {
  var alpha = ((p2.y - p3.y)*(p.x - p3.x) + (p3.x - p2.x)*(p.y - p3.y)) / ((p2.y - p3.y)*(p1.x - p3.x) + (p3.x - p2.x)*(p1.y - p3.y));
  var beta = ((p3.y - p1.y)*(p.x - p3.x) + (p1.x - p3.x)*(p.y - p3.y)) / ((p2.y - p3.y)*(p1.x - p3.x) + (p3.x - p2.x)*(p1.y - p3.y));
  var gamma = 1 - alpha - beta;

  return alpha > 0 && beta > 0 && gamma > 0;
}
