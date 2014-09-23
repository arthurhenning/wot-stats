angular.module('wotApp', ['wotServices'])

.controller('PlayerController', function($scope, $http, ExpectedValuesService) {

	var clusters = {
		'EU': {
			apiAddress: 'http://api.worldoftanks.eu',
			applicationId: 'd0a293dc77667c9328783d489c8cef73'
		}
	};
	var version = "2.0";

	$scope.periods = [
		'1', '7', '28', 'all'
	];

	var expectedTankValues = ExpectedValuesService.values;

	$scope.searchPlayer = function () {
		$scope.playerRatingsFound = false;

		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/account/list/?application_id=' + clusters['EU'].applicationId + '&search=' + $scope.playerName})
		.success(function(data, status, headers, config) {
			$scope.playerSearchList = data;
			$scope.playerNotFound = false;
		})
		.error(function(data, status, headers, config) {
			$scope.playerNotFound = true;
		});
	};

	$scope.getPlayerRatings = function (accountId) {

		if (!$scope.chosenPeriod) {
			$scope.chosenPeriod = $scope.periods[0];
		}

		if (accountId) {
			$scope.accountId = accountId;
		}

		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/ratings/accounts/?application_id=' + clusters['EU'].applicationId + '&account_id=' + $scope.accountId + '&type=' + $scope.chosenPeriod})
		.success(function(data, status, headers, config) {
			$scope.playerStats = data.data[$scope.accountId];
			getPlayerTanks();
			$scope.playerRatingsFound = true;
		})
		.error(function(data, status, headers, config) {
			$scope.playerRatingsFound = false;
		});
	};

	$scope.getTankNameById = function (tankId) {
		if ($scope.allTanks[tankId]) {
			return $scope.allTanks[tankId].short_name_i18n;
		}
		return null;
	};

	$scope.getMasteryMarkById = function (masteryId) {
		var masteyMark = 'None';
		switch(masteryId) {
			case 1: masteyMark = '3rd Class';
					break;
			case 2: masteyMark = '2nd Class';
					break;
			case 3: masteyMark = '1st Class';
					break;
			case 4: masteyMark = 'Ace Tanker';
					break;
		}
		return masteyMark;
	};

	var getPlayerTanks = function () {
		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/tanks/stats/?application_id=' + clusters['EU'].applicationId + '&account_id=' + $scope.accountId})
		.success(function(data, status, headers, config) {
			$scope.playerTanks = data.data[$scope.accountId];

			// calculate wn8 for each tank
			for (var i = 0; i < $scope.playerTanks.length; i++) {
				$scope.playerTanks[i].wn8 = calculateWn8($scope.playerTanks[i]);
			}
			calculateOverallWn8();
		})
		.error(function(data, status, headers, config) {
			// player tanks error
		});
	};

	var getAllTanks = function () {
		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/encyclopedia/tanks/?application_id=' + clusters['EU'].applicationId})
		.success(function(data, status, headers, config) {
			$scope.allTanks = data.data;
		})
		.error(function(data, status, headers, config) {
			// all tanks error
		});
	};

	var findExpectedValuesByTankId = function (tankId) {
		for (var i = 0; i < expectedTankValues.length; i++) {
			if (tankId == expectedTankValues[i].IDNum) {
				return expectedTankValues[i];
			}
		}
		return null;
	};

	var calculateExpected = function (real, battles, expected) {
		return (real / battles) / expected;
	};

	var calculateWn8 = function (tank) {

		var tankId = tank.tank_id;
		var expectedValues = findExpectedValuesByTankId(tankId);
		var battles = tank.all.battles;

		// step 1
		if (expectedValues) {
			var rDamage = calculateExpected(tank.all.damage_dealt, battles, expectedValues.expDamage);
			var rSpot = calculateExpected(tank.all.spotted, battles, expectedValues.expSpot);
			var rFrag = calculateExpected(tank.all.frags, battles, expectedValues.expFrag);
			var rDef = calculateExpected(tank.all.dropped_capture_points, battles, expectedValues.expDef);
			var rWin = calculateExpected(tank.all.wins, battles, expectedValues.expWinRate);

			// step 2
			var rWinc = Math.max(0, (rWin - 0.71) / (1 - 0.71));
			var rDamageEc = Math.max(0, (rDamage - 0.22) / (1 - 0.22));
			var rFragc = Math.max(0, Math.min(rDamageEc + 0.2, (rFrag - 0.12) / (1 - 0.12)));
			var rSpotc = Math.max(0, Math.min(rDamageEc + 0.1, (rSpot - 0.38) / (1 - 0.38)));
			var rDefc = Math.max(0, Math.min(rDamageEc + 0.1, (rDef - 0.10) / (1 - 0.10)));

			// step 3
			var wn8 = 980 * rDamageEc + 210 * rDamageEc * rFragc + 155 * rFragc * rSpotc + 75 * rDefc * rFragc + 145 * Math.min(1.8, rWinc);
		}
		return wn8;
	};

	var calculateOverallWn8 = function () {
		if ($scope.playerTanks) {
			var overallWn8 = 0;
			var totalWn8Battles = 0;
			for (var i = 0; i < $scope.playerTanks.length; i++) {
				if ($scope.playerTanks[i].wn8) {
					overallWn8 += $scope.playerTanks[i].wn8 * $scope.playerTanks[i].all.battles;
					totalWn8Battles += $scope.playerTanks[i].all.battles;
				}
			}
			$scope.overallWn8 = overallWn8 / totalWn8Battles;
		}
	};

	getAllTanks();
});
