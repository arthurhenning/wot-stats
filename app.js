angular.module('wotApp', ['wotServices.wn8'])

.controller('PlayerController', function($scope, $http, Wn8Service) {

	var clusters = {
		'EU': {
			apiAddress: 'https://api.worldoftanks.eu',
			applicationId: 'd0a293dc77667c9328783d489c8cef73'
		}
	};
	var version = "2.0";

	$scope.periods = [
		'1', '7', '28', 'all'
	];

	var allTanks = null;

	$scope.searchPlayer = function () {
		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/account/list/?application_id=' + clusters['EU'].applicationId + '&search=' + $scope.playerName})
		.success(function(data, status, headers, config) {
			if (data.status !== "error" && data.data.length) {
				$scope.playerSearchList = data;
				$scope.playerNotFound = false;
			} else {
				$scope.playerNotFound = true;
			}
		})
		.error(function(data, status, headers, config) {
			$scope.playerNotFound = true;
		});
	};

	$scope.getPlayerRatings = function (accountId, playerNickname) {

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
			if (playerNickname) {
				$scope.playerNickname = playerNickname;
			}
		})
		.error(function(data, status, headers, config) {
			$scope.playerRatingsFound = false;
		});
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

	$scope.sort = function (sortCriteria) {
		if ($scope.sortCriteria === sortCriteria) {
			$scope.sortReverse = !$scope.sortReverse;
		} else {
			$scope.sortCriteria = sortCriteria;
			$scope.sortReverse = true;
		}
	}

	var getPlayerTanks = function () {
		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/tanks/stats/?application_id=' + clusters['EU'].applicationId + '&account_id=' + $scope.accountId})
		.success(function(data, status, headers, config) {
			$scope.playerTanks = data.data[$scope.accountId];

			// calculate wn8 and stats for each tank
			for (var i = 0; i < $scope.playerTanks.length; i++) {
				$scope.playerTanks[i].winrate = calculateWinrate($scope.playerTanks[i]);
				$scope.playerTanks[i].average_damage = calculateAverageDamage($scope.playerTanks[i]);
				$scope.playerTanks[i].average_xp = calculateAverageXp($scope.playerTanks[i]);
				$scope.playerTanks[i].level = allTanks[$scope.playerTanks[i].tank_id].level;
				$scope.playerTanks[i].name = allTanks[$scope.playerTanks[i].tank_id].short_name_i18n;
				
				var wn8Obj = Wn8Service.calculateTankWn8($scope.playerTanks[i]);
				$scope.playerTanks[i].wn8 = wn8Obj.wn8;
				$scope.playerTanks[i].expectedWinrate = wn8Obj.expectedWinrate;
				$scope.playerTanks[i].expectedDamage = wn8Obj.expectedDamage;
			}

			// calculate overall wn8
			$scope.overallWn8 = Wn8Service.calculateOverallWn8($scope.playerTanks);
		})
		.error(function(data, status, headers, config) {
			// player tanks error
		});
	};

	var getAllTanks = function () {
		$http({method: 'GET', url: clusters['EU'].apiAddress + '/' + version + '/encyclopedia/tanks/?application_id=' + clusters['EU'].applicationId})
		.success(function(data, status, headers, config) {
			allTanks = data.data;
		})
		.error(function(data, status, headers, config) {
			// all tanks error
		});
	};

	var calculateWinrate = function (tank) {
		return (tank.all.wins / tank.all.battles) * 100;
	};

	var calculateAverageDamage = function (tank) {
		return tank.all.damage_dealt / tank.all.battles;
	};

	var calculateAverageXp = function (tank) {
		return tank.all.xp / tank.all.battles;
	};

	$scope.sortCriteria = 'all.battles';
	$scope.sortReverse = true;
	getAllTanks();
});
