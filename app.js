angular.module('wotApp', ['wotServices.wn8'])

.controller('PlayerController', function($scope, $http, Wn8Service) {

	var clusters = {
		'EU': {
			apiAddress: 'https://api.worldoftanks.eu',
			applicationId: 'd0a293dc77667c9328783d489c8cef73'
		}
	};
	var version = "2.0";
	var allTanks = null, allMissingTanks = [];
	
	$scope.dataOrigin = 'xvm';
	$scope.calculating = false;

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
		$scope.calculating = true;

		if (accountId) {
			$scope.accountId = accountId;
		}
		if (playerNickname) {
			$scope.playerNickname = playerNickname;
		}

		$scope.playerRatingsFound = true;

		getPlayerTanks();
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
				var tank = $scope.playerTanks[i],
					tankInfo = allTanks[tank.tank_id];

				if (tankInfo) {
					// might have be tanks that are no longer available

					$scope.playerTanks[i].winrate = calculateWinrate(tank);
					$scope.playerTanks[i].average_damage = calculateAverageDamage(tank);
					$scope.playerTanks[i].average_xp = calculateAverageXp(tank);
					$scope.playerTanks[i].level = tankInfo.level;
					$scope.playerTanks[i].name = tankInfo.short_name_i18n;
				
					var wn8Obj = Wn8Service.calculateTankWn8(tank);
					if (wn8Obj) {
						$scope.playerTanks[i].wn8 = wn8Obj.wn8;
						$scope.playerTanks[i].expectedWinrate = wn8Obj.expectedWinrate;
						$scope.playerTanks[i].expectedDamage = wn8Obj.expectedDamage;
					} else {
						$scope.playerTanks[i].wn8 = 0;
						$scope.playerTanks[i].expectedWinrate = $scope.playerTanks[i].winrate;
						$scope.playerTanks[i].expectedDamage = $scope.playerTanks[i].average_damage;
					}
				} else {
					allMissingTanks.push(tank);
				}
			}

			// calculate overall wn8
			$scope.overallWn8 = Wn8Service.calculateOverallWn8($scope.playerTanks);
			$scope.expectedValuesVersion = Wn8Service.expectedValuesVersion();

			$scope.allMissingTanks = allMissingTanks;
			$scope.calculating = false;
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

	// setup expected values
	Wn8Service.getExpectedValues($scope.dataOrigin);
	
	$scope.$watch('dataOrigin', function (newOrigin) {
		Wn8Service.getExpectedValues($scope.dataOrigin);
		if ($scope.playerRatingsFound) {
			// recalculate
			$scope.getPlayerRatings($scope.accountId, $scope.playerNickname);
		}
  });
});
