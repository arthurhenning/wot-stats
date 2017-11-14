angular.module('wotServices.wn8', ['wotServices.expectedValues'])

.factory('Wn8Service', ['ExpectedValuesService', function(ExpectedValuesService) {
	
	var getExpectedValues = function(origin) {
		ExpectedValuesService.getExpectedValues(origin);
	}

	var calculateTankWn8 = function (tank) {
		var tankId = tank.tank_id;
		var expectedValues = ExpectedValuesService.getExpectedValuesByTankId(tankId);
		var battles = tank.all.battles;

		// step 1
		if (expectedValues) {
			var rDamage = tank.average_damage / expectedValues.expDamage;
			var rSpot = (tank.all.spotted / battles) / expectedValues.expSpot;
			var rFrag = (tank.all.frags / battles) / expectedValues.expFrag;
			var rDef = (tank.all.dropped_capture_points / battles) / expectedValues.expDef;
			var rWin = (tank.all.wins / battles * 100) / expectedValues.expWinRate;

			// step 2
			var rWinc = Math.max(0, (rWin - 0.71) / (1 - 0.71));
			var rDamageEc = Math.max(0, (rDamage - 0.22) / (1 - 0.22));
			var rFragc = Math.max(0, Math.min(rDamageEc + 0.2, (rFrag - 0.12) / (1 - 0.12)));
			var rSpotc = Math.max(0, Math.min(rDamageEc + 0.1, (rSpot - 0.38) / (1 - 0.38)));
			var rDefc = Math.max(0, Math.min(rDamageEc + 0.1, (rDef - 0.10) / (1 - 0.10)));

			// step 3
			var wn8 = 980 * rDamageEc + 210 * rDamageEc * rFragc + 155 * rFragc * rSpotc + 75 * rDefc * rFragc + 145 * Math.min(1.8, rWinc);
		
			var roundedWn8 = Math.round(wn8);
			var wn8Return = {
				wn8: wn8,
				expectedWinrate: expectedValues.expWinRate,
				expectedDamage: expectedValues.expDamage
			};
			return wn8Return;
		}
		return null;
	};

	var calculateOverallWn8 = function (playerTanks) {
		if (playerTanks) {

			var overallWn8 = 0;
			var totalWn8Battles = 0;
			var expDamage = 0, expSpot = 0, expFrag = 0, expDef = 0, expWins = 0;
			var realDamage = 0, realSpot = 0, realFrag = 0, realDef = 0, realWins = 0;

			for (var i = 0; i < playerTanks.length; i++) {
				var tank = playerTanks[i];
				var tankId = tank.tank_id;
				var expectedValues = ExpectedValuesService.getExpectedValuesByTankId(tankId);
				var battles = tank.all.battles;

				// step 1
				if (expectedValues) {
					expDamage += battles * expectedValues.expDamage;
					expSpot += battles * expectedValues.expSpot;
					expFrag += battles * expectedValues.expFrag;
					expDef += battles * expectedValues.expDef;
					expWins += battles * expectedValues.expWinRate / 100;

					realDamage += tank.all.damage_dealt;
					realSpot += tank.all.spotted;
					realFrag += tank.all.frags;
					realDef += tank.all.dropped_capture_points;
					realWins += tank.all.wins;
				}
			}

			var rDamage = realDamage / expDamage;
			var rSpot = realSpot / expSpot;
			var rFrag = realFrag / expFrag;
			var rDef = realDef / expDef;
			var rWin = realWins / expWins;

			// step 2
			var rWinc = Math.max(0, 	(rWin - 0.71) / (1 - 0.71));
			var rDamageEc = Math.max(0,	(rDamage - 0.22) / (1 - 0.22));
			var rFragc = Math.max(0, 	Math.min(rDamageEc + 0.2, (rFrag - 0.12) / (1 - 0.12)));
			var rSpotc = Math.max(0, 	Math.min(rDamageEc + 0.1, (rSpot - 0.38) / (1 - 0.38)));
			var rDefc = Math.max(0, 	Math.min(rDamageEc + 0.1, (rDef - 0.10) / (1 - 0.10)));

			// step 3
			var wn8 = 980 * rDamageEc + 210 * rDamageEc * rFragc + 155 * rFragc * rSpotc + 75 * rDefc * rFragc + 145 * Math.min(1.8, rWinc);

			return wn8;
		}
	};

	var getVersion = function () {
		return ExpectedValuesService.getExpectedValuesVersion();
	};

	// public API
  	return {
  		calculateTankWn8: calculateTankWn8,
  		calculateOverallWn8: calculateOverallWn8,
  		expectedValuesVersion: getVersion,
  		getExpectedValues: getExpectedValues
  	};
}]);
