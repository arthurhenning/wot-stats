angular.module('wotServices.expectedValues', [])

	.factory('ExpectedValuesService', ['$http', function ($http) {
		var expectedTankValues = [];

		var getExpectedValues = function (origin) {
			var useXvmValues = origin === 'xvm';
			var expectedTankValuesUrl = useXvmValues ? 'expected_values/expected_tank_values.xvm.json' : 'expected_values/expected_tank_values.wnefficiency.json';
	
			$http({ method: 'GET', url: expectedTankValuesUrl })
				.success(function (data, status, headers, config) {
					expectedTankValues = data;
				})
				.error(function (data, status, headers, config) {
					throw new Error(data);
				});
		}
		
		var getExpectedValuesByTankId = function (tankId) {
			for (var i = 0; i < expectedTankValues.data.length; i++) {
				if (tankId == expectedTankValues.data[i].IDNum) {
					return expectedTankValues.data[i];
				}
			}
			return null;
		};
		
		var getExpectedValuesVersion = function () {
			return expectedTankValues.header.version;
		};

		// public API
		return {
			getExpectedValuesByTankId: getExpectedValuesByTankId,
			getExpectedValuesVersion: getExpectedValuesVersion,
			getExpectedValues: getExpectedValues
		};
}]);
