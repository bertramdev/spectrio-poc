'use strict';
const auth = require("../utils/auth");
const customer = require("../handlers/customer");
const constants = require("../utils/constants");
const util = require("../utils/util");
const moment = require('moment');
const req = require('superagent');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const dynamoDb = new AWS.DynamoDB.DocumentClient();
AWS.config.region = process.env.REGION;

function getDailyInfo(customerId, externalId, fromString2, name) {
	return {
		id: customerId+'-'+externalId+'-'+fromString2,
		customerId: customerId,
		customerVenueId: customerId+'-'+externalId,
		name: name,
		externalId: externalId,
		date: fromString2,
		visitors: 0,
		visits: 0,
		genderCaptured: 0,
		ageCaptured: 0,
		sourceCaptured: 0,
		source: {},
		age: {
			age0to17:0,
			age18to24:0,
			age25to34:0,
			age35to44:0,
			age45to54:0,
			age55to64:0,
			ageOver65:0
		},
		gender: {
			male: 0,
			female: 0
		}
	};
}

module.exports.fetchVenueDailyTotals = (event, context, callback) => {
	console.log('event');
	var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : null,
		venueId = event.queryStringParameters ? event.queryStringParameters.venueId : null,
		fromPrm = (event.queryStringParameters ? event.queryStringParameters.from : null),
		toPrm = (event.queryStringParameters ? event.queryStringParameters.to : null),
		includeDays = (event.queryStringParameters ? event.queryStringParameters.includeDays : null) == 'true',
		fromDate = fromPrm ? moment(fromPrm, 'YYYYMMDD') : moment().add(-7, 'days'),
		toDate = toPrm ? moment(toPrm, 'YYYYMMDD') : moment(constants.MOMENTS.now),
		fromQPrm = fromDate.format('YYYY-MM-DD'),
		toQPrm = toDate.format('YYYY-MM-DD'),
		dynamoDbTable = constants.DYNAMODB_TABLES.venueDailyTotals;
	if (!customerId) {
		callback(null, util.getCallbackBody(false, 400, 'Customer id missing'));
		return;
	}
	if (!venueId) {
		callback(null, util.getCallbackBody(false, 400, 'Venue id missing'));
		return;
	}
	const dailyTotalsParams = {
		TableName : dynamoDbTable,
		IndexName: dynamoDbTable+'-customer-venue-index',
		KeyConditionExpression: "#cvId = :customerVenueId and #d between :fromQPrm and :toQPrm",
		ExpressionAttributeNames: { "#d":"date","#cvId":"customerVenueId" },		
		ExpressionAttributeValues: { ":customerVenueId":(customerId+'-'+venueId), ":fromQPrm":fromQPrm, ":toQPrm":toQPrm }
	}; 
	console.log(dailyTotalsParams);
	// being aync db query
	dynamoDb.query(dailyTotalsParams, function(err, data) {
		if (err) {
			console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
		} else {
			let outputData = getDailyInfo(customerId, venueId, fromQPrm, null);
			outputData.startDate = fromQPrm;
			outputData.endDate = toQPrm;
			delete outputData.date;
			data.Items.forEach(function(item) {
				outputData.name = item.name;
				for (let k in item) {
					let v = item[k];
					if (k != 'id' && k != 'customerId' &&
						k != 'customerVenueId' && k != 'name' &&
						k != 'externalId' && k != 'date' &&
						Number.isInteger(v)
					) {
						outputData[k] = outputData[k] || 0;
						outputData[k] += v;
					}
					else if (k == 'gender' || k == 'age' || k == 'source') {
						for (let k1 in item[k]) {
							outputData[k][k1] = outputData[k][k1] || 0;
							outputData[k][k1] += item[k][k1];
						}
					}
				}
			});
			if (includeDays) outputData.days = data.Items;
			callback(null, util.getCallbackBody(true, 200, 'Daily totals between '+fromDate.toString() + ' and '+toDate.toString(), outputData));
		}
	});
}

module.exports.calculateVenuesDailyTotals = (event, context, callback) => {
	console.log(event);
	var customerId = event.queryStringParameters ? event.queryStringParameters.customerId : null,
		dynamoDbTable = constants.DYNAMODB_TABLES.customers;
	if (!customerId) {
		callback(null, util.getCallbackBody(false, error.statusCode || 400, 'Customer id missing'));
		return;
	}		
	dynamoDb.get({ TableName: dynamoDbTable, Key: { id: customerId } }, (error, data) => { // get customer record
		if (error) {
			console.error(error);
			callback(null, util.getCallbackBody(false, error.statusCode || 501, error.toString()));
			return;
		}
		else if (!data.Item) {
			callback(null, util.getCallbackBody(false, 404,  'Customer not found'));
		}
		else if (data.Item.active == false) {
			console.error(error);
			callback(null, util.getCallbackBody(false, error.statusCode || 501,  'Customer is not active'));
			return;
		}
		else if (!data.Item.purplePublicKey || !data.Item.purplePrivateKey) {
			console.error(error);
			callback(null, util.getCallbackBody(false, error.statusCode || 401, 'Customer is missing wifi access keys'));
			return;
		}
		else {
			// these are globals to request
			const publicKey = data.Item.purplePublicKey, //'ca722481fcff8361d4fe2ac3a476aba4'
				privateKey = data.Item.purplePrivateKey, //'fcc4780fc12bdf89e0bc81371e45d9b3',
				fromPrm = (event.queryStringParameters ? event.queryStringParameters.from : null),
				toPrm = (event.queryStringParameters ? event.queryStringParameters.to : null),
				fromDate = fromPrm ? moment(fromPrm, 'YYYYMMDD') : moment().add(-1, 'days'),
				toDate = toPrm ? moment(toPrm, 'YYYYMMDD') : moment(constants.MOMENTS.now)
				;
			// being async db query
			const now = new Date(), // for timestamping request
				pth = '/api/company/v1/venues',
				ath = auth.getAuthInfo(publicKey, privateKey, pth, now),
				hdr = ath.header,
				portalD = ath.portalDomain,
				u = 'https://'+portalD+pth;

			req
			.get(u)
			.accept('application/json')
			.retry(2) // retry a couple times incase of 502
			.set('Host', portalD).set('Content-Type', 'application/json').set('Content-Length', '0').set('Date', now.toUTCString()) // these are standard headers
			.set('X-API-Authorization', hdr) // special purple API auth header
			.then(function(res) {
				if (res.body && res.body.data && res.body.data.venues) {
					res.body.data.venues.forEach(function(item) {
						let newFrom = moment(fromDate),
							count = 0;
						// begin loop through days
						while ((newFrom.isBefore(toDate) || newFrom.isSame(toDate) )) {
							// local to the loop
							let thisFrom = moment(newFrom),
								path = '/api/company/v1/venue/'+item.id+'/visitors?from='+thisFrom.format('YYYYMMDD')+'&to='+thisFrom.format('YYYYMMDD'),
								authInfo = auth.getAuthInfo(publicKey, privateKey, path, now),
								header = authInfo.header,
								portalDomain = authInfo.portalDomain,
								url = 'https://'+portalDomain+path,
								externalId = item.id,
								name = item.name,
								fromString2 = thisFrom.format('YYYY-MM-DD');
							console.log(' querying purple API for venue ' + item.id + ' on '+fromString2);
							// begin async API query for visitors
							req
								.get(url)
								.accept('application/json')
								.retry(2) // retry a couple times incase of 502
								.set('Host', portalDomain).set('Content-Type', 'application/json').set('Content-Length', '0').set('Date', now.toUTCString()) // these are standard headers
								.set('X-API-Authorization', header) // special purple API auth header
								.then(function(res) {
									//console.log(res);
									let msg = 'Visitors not found',
										successCount = 0;
									if (res.body && res.body.data && res.body.data.visitors) {
										let visitors = res.body.data.visitors,
											dailyTotals = getDailyInfo(customerId, externalId, fromString2, name);
										dailyTotals.visitors = visitors.length;
										visitors.forEach (function(visitor, i) {
											if (visitor.visits) dailyTotals.visits += parseInt(visitor.visits);
											['gender', 'source'].forEach((fld)=>{
												if (visitor[fld]) {
													let fldVal  = visitor[fld];
													fldVal = fldVal == 'M' ? 'male' : fldVal; // stupid decoding gender
													fldVal = fldVal == 'F' ? 'female' : fldVal;
													dailyTotals[fld+'Captured']++;
													dailyTotals[fld][fldVal] = dailyTotals[fld][fldVal] || 0;
													dailyTotals[fld][fldVal]++;
												}
											});
											if (visitor.date_of_birth) {
												try {
													let birth = moment(visitor.date_of_birth);
													dailyTotals['ageCaptured']++;
													if (birth.isAfter(constants.MOMENTS.age13Birth)) dailyTotals.age.age0to13++;
													else if (birth.isAfter(constants.MOMENTS.age18Birth)) dailyTotals.age.age13to17++;
													else if (birth.isAfter(constants.MOMENTS.age25Birth)) dailyTotals.age.age18to24++;
													else if (birth.isAfter(constants.MOMENTS.age35Birth)) dailyTotals.age.age25to34++;
													else if (birth.isAfter(constants.MOMENTS.age45Birth)) dailyTotals.age.age35to44++;
													else if (birth.isAfter(constants.MOMENTS.age55Birth)) dailyTotals.age.age45to54++;
													else if (birth.isAfter(constants.MOMENTS.age65Birth)) dailyTotals.age.age55to64++;
													else dailyTotals.age.ageOver65++;
												}
												catch (e) {
													console.log(e);
												}
											}
											// store daily totales
											let params = {
												TableName: dynamoDbTable,
												Key: { id: dailyTotals.id },
												Item: dailyTotals
											};
											dynamoDb.put(params, (error) => {
												if (error) {
													console.error(error);
													console.log('Could not save with totals '+params.Key.id);
												}
												else {
													console.log('Saved with totals '+params.Key.id);
													console.log(dailyTotals);
												}
											});
											successCount++;	  
										});
									}
								})
								.catch((error) => {
									//console.log(error);
									if (error.status == 404) {
										console.log('No visitors to '+ externalId + ' for '+fromString2);
									}
									const dailyTotals = getDailyInfo(customerId, externalId, fromString2, name);
									// store daily totales
									let params = {
										TableName: dynamoDbTable,
										Key: { id: dailyTotals.id.toString() },
										Item: dailyTotals
									};
									dynamoDb.put(params, (error) => {
										if (error) {
											console.error(error);
											console.log('Could not save without totals '+params.Key.id);
										}
										else {
											console.log('Saved without totals '+params.Key.id);
										}
									});
								});
							// end API query for visitors
							newFrom.add(1,'days');
							count++;
						}
						// end loop through days
					});
					callback(null, util.getCallbackBody(true, 200, 'Aggregated visitors for venues from '+fromDate.toString() + ' to '+toDate.toString()));					
				}
				else {
					console.log('No venues for '+ customerId);
					callback(null, util.getCallbackBody(true, 404, 'No venues for '+customerId));					
				}				
			})
			.catch((error) => {
				console.log(error);
				callback(null, util.getCallbackBody(true, 400, error.toString()));					
			});
		}
	});
};

module.exports.calculateAllVenuesDailyTotals = (event, context, callback) => {
    console.log('aggregate.calculateAllVenuesDailyTotals');
	event.queryStringParameters = event.queryStringParameters || {};
    customer.fetch(null, function(err, data) {
        if (err) {
            callback(null, util.getCallbackBody(true, 400, err));
        }
        else {
            data.forEach(function(customer){
                if (customer.purpleAccountId && customer.purplePublicKey && customer.purplePrivateKey) {
					console.log('importing for ' + customer.customerName);
					event.queryStringParameters.customerId = customer.id;
					module.exports.calculateVenuesDailyTotals(event, context, callback);
                }
			});			
            callback(null, util.getCallbackBody(true, 200, 'Aggregating all customer venue daily totals'));
        }
    });
	
};	